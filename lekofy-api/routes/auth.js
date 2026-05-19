const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const UserModel = require('../models/User');
const Ad = require('../models/Ad');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const axios = require('axios');

const upload = multer({ dest: 'uploads/' });
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Р РµРіРёСЃС‚СЂР°С†РёСЏ
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    if (!name || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ error: 'Пароль должен содержать заглавную букву, цифру и спецсимвол (минимум 8 символов)' });
    }

    const normalizedPhone = String(phone).trim();
    const generatedEmail = (email && String(email).trim())
      ? String(email).trim().toLowerCase()
      : `user_${normalizedPhone.replace(/[^0-9]/g, '') || Date.now()}@lekofy.local`;

    const existing = await UserModel.findOne({ where: { email: generatedEmail } });
    if (existing) return res.status(400).json({ error: 'Пользователь уже существует' });

    const hash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email: generatedEmail, password: hash, phone: normalizedPhone });
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        telegramEnabled: user.telegramEnabled,
        telegramConfirmed: user.telegramConfirmed,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Р’С…РѕРґ
router.post('/login', async (req, res) => {
  try {
    const { login, email, password } = req.body;
    const loginValue = String(login || email || '').trim();
    if (!loginValue || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const isEmailLogin = loginValue.includes('@');
    const user = await UserModel.findOne({ where: isEmailLogin ? { email: loginValue.toLowerCase() } : { phone: loginValue } });
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

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        telegramEnabled: user.telegramEnabled,
        telegramConfirmed: user.telegramConfirmed,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// РџСЂРѕС„РёР»СЊ С‚РµРєСѓС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
router.get('/me', auth, async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// РџСѓР±Р»РёС‡РЅС‹Р№ РїСЂРѕС„РёР»СЊ РїРѕ ID
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.params.id, {
      attributes: ['id', 'name', 'avatar', 'bio', 'createdAt', 'telegramEnabled', 'telegramConfirmed'],
    });
    if (!user) return res.status(404).json({ error: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ' });
    const ads = await Ad.findAll({
      where: { userId: req.params.id, status: 'active' },
      order: [['createdAt', 'DESC']],
    });
    res.json({ user, ads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// РћР±РЅРѕРІР»РµРЅРёРµ РїСЂРѕС„РёР»СЏ С‚РµРєСѓС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ (РёРјСЏ, С‚РµР»РµС„РѕРЅ, РѕРїРёСЃР°РЅРёРµ, Р°РІР°С‚Р°СЂ)
router.put('/me', auth, upload.single('avatar'), async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ' });

    const { name, phone, bio } = req.body;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'lekofy-avatars',
          transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
        });
        user.avatar = result.secure_url;
      } catch (e) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р°РІР°С‚Р°СЂР°:', e.message);
      } finally {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
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

// ===== Google OAuth =====
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:3000/api/auth/google/callback';

  if (!clientId) {
    return res
      .status(500)
      .send('Google OAuth РЅРµ РЅР°СЃС‚СЂРѕРµРЅ (РЅРµС‚ GOOGLE_CLIENT_ID)');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send('РќРµ РїРµСЂРµРґР°РЅ РєРѕРґ Р°РІС‚РѕСЂРёР·Р°С†РёРё');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      return res
        .status(500)
        .send('Google OAuth РЅРµ РЅР°СЃС‚СЂРѕРµРЅ (РЅРµС‚ CLIENT_ID РёР»Рё CLIENT_SECRET)');
    }

    const tokenResp = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResp.data;

    const profileResp = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const profile = profileResp.data;
    const email = profile.email;
    const name =
      profile.name || profile.given_name || profile.email || 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ';

    if (!email) {
      return res.status(400).send('РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ email РѕС‚ Google');
    }

    let user = await UserModel.findOne({ where: { email } });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10);
      const hash = await bcrypt.hash(randomPassword, 10);
      user = await UserModel.create({
        name,
        email,
        password: hash,
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    const clientUrl = process.env.CLIENT_APP_URL || 'http://localhost:5173';
    const userPayload = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }),
    );

    res.redirect(
      `${clientUrl}/auth/google/success?token=${encodeURIComponent(
        token,
      )}&user=${userPayload}`,
    );
  } catch (err) {
    console.error('РћС€РёР±РєР° Google OAuth:', err.response?.data || err.message);
    res.status(500).send('РћС€РёР±РєР° РІС…РѕРґР° С‡РµСЂРµР· Google');
  }
});


module.exports = router;


