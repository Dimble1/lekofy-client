const crypto = require('crypto');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const PhoneOtpChallenge = require('../models/PhoneOtpChallenge');

const OTP_LENGTH = Number(process.env.WHATSAPP_OTP_LENGTH || 6);
const OTP_TTL_MS = Number(process.env.WHATSAPP_OTP_TTL_SECONDS || 300) * 1000;
const REQUEST_COOLDOWN_MS = Number(process.env.WHATSAPP_OTP_COOLDOWN_SECONDS || 30) * 1000;
const MAX_ATTEMPTS = Number(process.env.WHATSAPP_OTP_MAX_ATTEMPTS || 5);
const DEBUG_MODE = process.env.NODE_ENV !== 'production' && process.env.WHATSAPP_DEBUG_OTP !== 'false';
const DELIVERY_MODE = (process.env.WHATSAPP_DELIVERY_MODE || 'local').toLowerCase();
const SENDER_NUMBER = process.env.WHATSAPP_SENDER_PHONE || process.env.WHATSAPP_SENDER_NUMBER || 'local-dev-sender';
const WHATSAPP_TOKEN = process.env.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_SENDER_PHONE_NUMBER_ID;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'lekofy_login_code';
const WHATSAPP_TEMPLATE_LANGUAGE = process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en_US';
const OTP_PURPOSES = new Set(['login', 'register', 'reset_password']);

const phoneCooldowns = new Map();
const ipCooldowns = new Map();

function normalizePhoneNumber(phone) {
  if (phone === null || phone === undefined) return '';
  const raw = String(phone).trim();
  if (!raw) return '';

  const digitsOnly = raw.replace(/[^\d+]/g, '');
  if (digitsOnly.startsWith('+')) {
    const digits = digitsOnly.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  const digits = digitsOnly.replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits}`;
}

function isValidPhoneNumber(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

function getRateLimitMessage(waitMs) {
  const seconds = Math.max(1, Math.ceil(waitMs / 1000));
  return `Слишком часто запрашиваете код. Подождите ${seconds} сек.`;
}

function touchCooldown(map, key, windowMs) {
  const now = Date.now();
  const last = map.get(key) || 0;
  const delta = now - last;
  if (delta < windowMs) {
    return windowMs - delta;
  }
  map.set(key, now);
  return 0;
}

function pruneCooldownMap(map, windowMs) {
  const threshold = Date.now() - Math.max(windowMs, OTP_TTL_MS);
  for (const [key, ts] of map.entries()) {
    if (ts < threshold) {
      map.delete(key);
    }
  }
}

function generateOtpCode() {
  const upperBound = 10 ** OTP_LENGTH;
  return crypto.randomInt(0, upperBound).toString().padStart(OTP_LENGTH, '0');
}

function generateFallbackEmail(phone) {
  const digits = phone.replace(/\D/g, '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `phone_${digits}_${suffix}@lekofy.local`;
}

function normalizeOtpPurpose(purpose) {
  const normalized = String(purpose || 'login').trim().toLowerCase();
  return OTP_PURPOSES.has(normalized) ? normalized : 'login';
}

function buildAuthUserPayload(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar || null,
    bio: user.bio || null,
    telegramEnabled: !!user.telegramEnabled,
    telegramConfirmed: !!user.telegramConfirmed,
  };
}

function issueToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

async function cleanupExpiredChallenges() {
  const now = new Date();
  await PhoneOtpChallenge.update(
    { status: 'expired' },
    {
      where: {
        status: 'pending',
        expiresAt: { [Op.lt]: now },
      },
    },
  );
}

async function deliverOtp({ phone, code, challengeId }) {
  const message = `Ваш код входа Lekofy: ${code}. Никому не сообщайте его.`;

  if (DELIVERY_MODE === 'local') {
    console.log(
      `[WhatsApp OTP][local] sender=${SENDER_NUMBER} to=${phone} challenge=${challengeId} message="${message}"`,
    );
    return { provider: 'local', delivered: true };
  }

  if (DELIVERY_MODE !== 'cloud') {
    throw new Error('WhatsApp delivery provider is not configured');
  }

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp Cloud API is not configured: set WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
  }

  const response = await axios.post(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: WHATSAPP_TEMPLATE_NAME,
        language: {
          code: WHATSAPP_TEMPLATE_LANGUAGE,
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: code,
              },
            ],
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  );

  return {
    provider: 'cloud',
    delivered: true,
    messageId: response.data?.messages?.[0]?.id || null,
  };
}

async function requestPhoneOtp({ phone, purpose, ip, userAgent }) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!isValidPhoneNumber(normalizedPhone)) {
    const error = new Error('Введите номер в международном формате, например +996700000000');
    error.status = 400;
    throw error;
  }

  pruneCooldownMap(phoneCooldowns, REQUEST_COOLDOWN_MS);
  pruneCooldownMap(ipCooldowns, REQUEST_COOLDOWN_MS);

  const phoneWait = touchCooldown(phoneCooldowns, normalizedPhone, REQUEST_COOLDOWN_MS);
  if (phoneWait > 0) {
    const error = new Error(getRateLimitMessage(phoneWait));
    error.status = 429;
    error.retryAfterMs = phoneWait;
    throw error;
  }

  const ipKey = ip || 'unknown';
  const ipWait = touchCooldown(ipCooldowns, ipKey, REQUEST_COOLDOWN_MS);
  if (ipWait > 0) {
    const error = new Error(getRateLimitMessage(ipWait));
    error.status = 429;
    error.retryAfterMs = ipWait;
    throw error;
  }

  await cleanupExpiredChallenges();
  await PhoneOtpChallenge.update(
    { status: 'superseded' },
    {
      where: {
        phone: normalizedPhone,
        status: 'pending',
      },
    },
  );

  const challengeId = crypto.randomUUID();
  const code = generateOtpCode();
  const otpHash = await bcrypt.hash(code, 10);
  const now = new Date();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  const challenge = await PhoneOtpChallenge.create({
    challengeId,
    phone: normalizedPhone,
    purpose: normalizeOtpPurpose(purpose),
    otpHash,
    status: 'pending',
    attempts: 0,
    expiresAt,
    lastSentAt: now,
    verifiedIp: null,
    verifiedUserAgent: null,
    deliveryProvider: DELIVERY_MODE,
    deliveredTo: normalizedPhone,
  });

  try {
    await deliverOtp({ phone: normalizedPhone, code, challengeId, ip, userAgent });
  } catch (error) {
    await challenge.destroy();
    throw error;
  }

  const response = {
    challengeId,
    expiresIn: Math.ceil(OTP_TTL_MS / 1000),
    resendAfter: Math.ceil(REQUEST_COOLDOWN_MS / 1000),
    delivery: DELIVERY_MODE,
  };

  if (DEBUG_MODE) {
    response.debugCode = code;
  }

  return response;
}

async function ensureUserForPhone(phone) {
  const normalizedPhone = normalizePhoneNumber(phone);
  const existing = await User.findOne({ where: { phone: normalizedPhone } });
  if (existing) {
    if (existing.isBlocked) {
      const error = new Error('Аккаунт заблокирован');
      error.status = 403;
      throw error;
    }

    return existing;
  }

  const emailBase = generateFallbackEmail(normalizedPhone);
  let email = emailBase;
  let suffix = 0;

  while (await User.findOne({ where: { email } })) {
    suffix += 1;
    email = emailBase.replace('@lekofy.local', `_${suffix}@lekofy.local`);
  }

  const generatedPassword = crypto.randomBytes(32).toString('hex');
  const passwordHash = await bcrypt.hash(generatedPassword, 10);
  const fallbackName = `Пользователь ${normalizedPhone.slice(-4) || normalizedPhone}`;

  return User.create({
    name: fallbackName,
    email,
    password: passwordHash,
    phone: normalizedPhone,
  });
}

async function verifyPhoneOtp({
  challengeId,
  phone,
  code,
  purpose,
  ip,
  userAgent,
  createUser = false,
}) {
  const normalizedPhone = normalizePhoneNumber(phone);
  const challenge = await PhoneOtpChallenge.findOne({ where: { challengeId } });

  if (!challenge) {
    const error = new Error('Код не найден или уже устарел');
    error.status = 404;
    throw error;
  }

  if (challenge.phone !== normalizedPhone) {
    const error = new Error('Номер не совпадает с запрошенным кодом');
    error.status = 400;
    throw error;
  }

  const expectedPurpose = normalizeOtpPurpose(purpose || challenge.purpose);
  if (challenge.purpose !== expectedPurpose) {
    const error = new Error('Неверный тип SMS-кода');
    error.status = 400;
    throw error;
  }

  if (challenge.status !== 'pending') {
    const error = new Error('Код уже использован или недоступен');
    error.status = 410;
    throw error;
  }

  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    await challenge.update({ status: 'expired' });
    const error = new Error('Срок действия кода истек');
    error.status = 410;
    throw error;
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    await challenge.update({ status: 'locked' });
    const error = new Error('Слишком много попыток. Запросите новый код');
    error.status = 429;
    throw error;
  }

  const submittedCode = String(code || '').trim();
  if (!/^\d+$/.test(submittedCode)) {
    const error = new Error('Введите только цифры из кода');
    error.status = 400;
    throw error;
  }

  const isValid = await bcrypt.compare(submittedCode, challenge.otpHash);
  if (!isValid) {
    const attempts = challenge.attempts + 1;
    await challenge.update({
      attempts,
      status: attempts >= MAX_ATTEMPTS ? 'locked' : 'pending',
    });

    const error = new Error('Неверный код');
    error.status = attempts >= MAX_ATTEMPTS ? 429 : 401;
    throw error;
  }

  await challenge.update({
    status: 'verified',
    verifiedAt: new Date(),
    verifiedIp: ip || null,
    verifiedUserAgent: userAgent || null,
  });

  if (!createUser) {
    return {
      challengeId: challenge.challengeId,
      purpose: challenge.purpose,
      phone: challenge.phone,
      verified: true,
    };
  }

  const user = await ensureUserForPhone(normalizedPhone);
  return {
    token: issueToken(user),
    user: buildAuthUserPayload(user),
    challengeId: challenge.challengeId,
  };
}

module.exports = {
  normalizePhoneNumber,
  isValidPhoneNumber,
  buildAuthUserPayload,
  issueToken,
  requestPhoneOtp,
  verifyPhoneOtp,
};
