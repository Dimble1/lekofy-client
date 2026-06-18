const router = require('express').Router();
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const UserModel = require('../models/User');
const Ad = require('../models/Ad');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const {
  normalizePhoneNumber,
  isValidPhoneNumber,
  buildAuthUserPayload,
  issueToken,
  requestPhoneOtp,
  verifyPhoneOtp,
} = require('../services/whatsappOtp');

const upload = multer({ dest: 'uploads/' });
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const whatsappVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'lekofy_whatsapp_verify_2026';

function createGeneratedEmail(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return `user_${digits || Date.now()}@lekofy.local`;
}

function buildAuthResponse(user) {
  return {
    token: issueToken(user),
    user: buildAuthUserPayload(user),
  };
}

async function findUserByPhone(phone) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!isValidPhoneNumber(normalizedPhone)) return null;

  return UserModel.findOne({
    where: {
      [Op.or]: [{ phone: normalizedPhone }, { phone }],
    },
  });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, challengeId, code } = req.body;
    if (!name || !phone || !password || !confirmPassword || !challengeId || !code) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ error: 'Пароль должен содержать заглавную букву, цифру и спецсимвол (минимум 8 символов)' });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ error: 'Введите номер телефона в международном формате, например +996700000000' });
    }

    const verification = await verifyPhoneOtp({
      challengeId,
      phone: normalizedPhone,
      code,
      purpose: 'register',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      createUser: false,
    });
    if (!verification?.verified) {
      return res.status(400).json({ error: 'Не удалось подтвердить SMS-код' });
    }

    const generatedEmail = (email && String(email).trim())
      ? String(email).trim().toLowerCase()
      : createGeneratedEmail(normalizedPhone);

    const existing = await UserModel.findOne({ where: { email: generatedEmail } });
    if (existing) return res.status(400).json({ error: 'Пользователь уже существует' });

    const existingPhone = await UserModel.findOne({ where: { phone: normalizedPhone } });
    if (existingPhone) return res.status(400).json({ error: 'Пользователь с таким номером уже существует' });

    const hash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email: generatedEmail, password: hash, phone: normalizedPhone });
    res.json(buildAuthResponse(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { login, email, password } = req.body;
    const loginValue = String(login || email || '').trim();
    if (!loginValue || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const isEmailLogin = loginValue.includes('@');
    const normalizedPhone = isEmailLogin ? null : normalizePhoneNumber(loginValue);
    if (!isEmailLogin && !isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ error: 'Введите номер телефона в международном формате' });
    }
    const user = await UserModel.findOne({
      where: isEmailLogin
        ? { email: loginValue.toLowerCase() }
        : {
            [Op.or]: [
              { phone: normalizedPhone },
              { phone: loginValue },
            ],
          },
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.isBlocked) {
      let banMsg = 'Аккаунт заблокирован';
      if (user.banReason) banMsg += ': ' + user.banReason;
      if (user.banUntil) banMsg += ' (до ' + new Date(user.banUntil).toLocaleDateString('ru') + ')';
      else if (user.banReason) banMsg += ' (навсегда)';
      return res.status(403).json({ error: banMsg });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Неверный пароль' });

    res.json(buildAuthResponse(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/request', async (req, res) => {
  try {
    const result = await requestPhoneOtp({
      phone: req.body?.phone,
      purpose: req.body?.purpose || 'login',
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Не удалось отправить код',
      retryAfterMs: err.retryAfterMs || undefined,
    });
  }
});

router.post('/whatsapp/verify', async (req, res) => {
  try {
    const result = await verifyPhoneOtp({
      challengeId: req.body?.challengeId,
      phone: req.body?.phone,
      code: req.body?.code,
      purpose: req.body?.purpose || 'login',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      createUser: true,
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Не удалось проверить код',
    });
  }
});

router.get('/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === whatsappVerifyToken) {
    return res.status(200).send(String(challenge || ''));
  }

  return res.sendStatus(403);
});

router.post('/whatsapp/webhook', (req, res) => {
  console.log('[WhatsApp webhook]', JSON.stringify(req.body));
  res.sendStatus(200);
});

router.post('/sms/request', async (req, res) => {
  try {
    const result = await requestPhoneOtp({
      phone: req.body?.phone,
      purpose: req.body?.purpose || 'login',
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Не удалось отправить код',
      retryAfterMs: err.retryAfterMs || undefined,
    });
  }
});

router.post('/sms/verify', async (req, res) => {
  try {
    const result = await verifyPhoneOtp({
      challengeId: req.body?.challengeId,
      phone: req.body?.phone,
      code: req.body?.code,
      purpose: req.body?.purpose || 'login',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      createUser: false,
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Не удалось проверить код',
    });
  }
});

router.post('/password/reset/request', async (req, res) => {
  try {
    const phone = req.body?.phone;
    const user = await findUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const result = await requestPhoneOtp({
      phone,
      purpose: 'reset_password',
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Не удалось отправить код',
      retryAfterMs: err.retryAfterMs || undefined,
    });
  }
});

router.post('/password/reset', async (req, res) => {
  try {
    const { phone, challengeId, code, password, confirmPassword } = req.body;
    if (!phone || !challengeId || !code || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ error: 'Пароль должен содержать заглавную букву, цифру и спецсимвол (минимум 8 символов)' });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ error: 'Введите номер телефона в международном формате' });
    }

    const verification = await verifyPhoneOtp({
      challengeId,
      phone: normalizedPhone,
      code,
      purpose: 'reset_password',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      createUser: false,
    });
    if (!verification?.verified) {
      return res.status(400).json({ error: 'Не удалось подтвердить SMS-код' });
    }

    const user = await findUserByPhone(normalizedPhone);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json(buildAuthResponse(user));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.params.id, {
      attributes: ['id', 'name', 'avatar', 'bio', 'createdAt', 'telegramEnabled', 'telegramConfirmed'],
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    const ads = await Ad.findAll({
      where: { userId: req.params.id, status: 'active' },
      order: [['createdAt', 'DESC']],
    });
    res.json({ user, ads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', auth, upload.single('avatar'), async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const { name, phone, bio } = req.body;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!isValidPhoneNumber(normalizedPhone)) {
        return res.status(400).json({ error: 'Введите номер телефона в международном формате' });
      }

      const duplicate = await UserModel.findOne({ where: { phone: normalizedPhone } });
      if (duplicate && Number(duplicate.id) !== Number(user.id)) {
        return res.status(400).json({ error: 'Пользователь с таким номером уже существует' });
      }

      user.phone = normalizedPhone;
    }
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'lekofy-avatars',
          transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
        });
        user.avatar = result.secure_url;
      } catch (e) {
        console.error('Ошибка загрузки аватара:', e.message);
      } finally {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }

    await user.save();
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      telegramEnabled: user.telegramEnabled,
      telegramConfirmed: user.telegramConfirmed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/telegram/settings', auth, async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.user.id, {
      attributes: ['telegramEnabled', 'telegramConfirmed', 'telegramUsername'],
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/telegram/settings', auth, async (req, res) => {
  try {
    const enabled = Boolean(req.body?.enabled);
    const user = await UserModel.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    user.telegramEnabled = enabled;
    await user.save();

    res.json({
      telegramEnabled: user.telegramEnabled,
      telegramConfirmed: user.telegramConfirmed,
      telegramUsername: user.telegramUsername || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
