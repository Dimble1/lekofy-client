const router = require('express').Router();
const auth = require('../middleware/auth');
const Ad = require('../models/Ad');
const Report = require('../models/Report');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Op } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const { sendTelegramNotification } = require('../services/telegram');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: 'uploads/' });

const BANNED_WORDS = ['Р Р…Р В°РЎР‚Р С”Р С•РЎвЂљР С‘Р С”', 'Р С•РЎР‚РЎС“Р В¶Р С‘Р Вµ', 'Р С—Р С•РЎР‚Р Р…Р С•', 'Р С•РЎР‚РЎС“Р В¶Р С‘РЎРЏ', 'Р С–Р ВµРЎР‚Р С•Р С‘Р Р…', 'Р С”Р С•Р С”Р В°Р С‘Р Р…', 'Р СР ВµРЎвЂћР ВµР Т‘РЎР‚Р С•Р Р…', 'Р Р…Р В°РЎРѓР Р†Р В°Р в„–', 'Р Р…Р В°РЎР‚Р С”Р С•'];

const CATEGORY_GROUPS = [
  ['cars'],
  ['electronics'],
  ['real_estate', 'real-estate', 'realty'],
  ['clothing', 'clothes'],
  ['services'],
  ['jobs'],
  ['home_garden', 'home-garden'],
  ['sports', 'sport-hobby'],
  ['kids'],
  ['pets', 'animals'],
  ['other'],
];

function containsBannedWords(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

function getCategoryVariants(category) {
  if (!category) return [];
  const normalized = String(category).trim();
  if (!normalized) return [];
  const group = CATEGORY_GROUPS.find((g) => g.includes(normalized));
  if (!group) return [normalized];
  return group;
}

const formatSom = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return amount.toLocaleString('ru-RU');
};

router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, city } = req.query;
    const where = { status: 'active' };
    if (search) where.title = { [Op.iLike]: '%' + search + '%' };
    if (category) {
      const variants = getCategoryVariants(category);
      where.category = variants.length > 1 ? { [Op.in]: variants } : variants[0];
    }
    if (city) where.city = city;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    const ads = await Ad.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Р РµРєРѕРјРµРЅРґР°С†РёРё: РїРѕС…РѕР¶РёРµ РѕР±СЉСЏРІР»РµРЅРёСЏ РїРѕ РєР°С‚РµРіРѕСЂРёРё/РіРѕСЂРѕРґСѓ, СЃРѕСЂС‚РёСЂРѕРІРєР° РїРѕ РїСЂРѕСЃРјРѕС‚СЂР°Рј
router.get('/recommend', async (req, res) => {
  try {
    const { category, city, excludeId, limit } = req.query;
    const where = { status: 'active' };
    if (category) {
      const variants = getCategoryVariants(category);
      where.category = variants.length > 1 ? { [Op.in]: variants } : variants[0];
    }
    if (city) where.city = city;
    if (excludeId) where.id = { [Op.ne]: parseInt(excludeId, 10) || 0 };
    const ads = await Ad.findAll({
      where,
      order: [['views', 'DESC']],
      limit: parseInt(limit, 10) || 10,
    });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my/list', auth, async (req, res) => {
  try {
    const ads = await Ad.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ error: 'РћР±СЉСЏРІР»РµРЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ' });
    await ad.increment('views');
    res.json(ad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/offer-price', auth, async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id, {
      include: [{ model: User, as: 'Owner', attributes: ['id', 'name'], required: false }],
    });
    if (!ad) {
      return res.status(404).json({ error: 'РћР±СЉСЏРІР»РµРЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ' });
    }
    if (Number(ad.userId) === Number(req.user.id)) {
      return res.status(400).json({ error: 'РќРµР»СЊР·СЏ РїСЂРµРґР»РѕР¶РёС‚СЊ С†РµРЅСѓ РїРѕ СЃРІРѕРµРјСѓ РѕР±СЉСЏРІР»РµРЅРёСЋ' });
    }

    const offeredPrice = Number(req.body?.offeredPrice);
    if (!Number.isFinite(offeredPrice) || offeredPrice <= 0) {
      return res.status(400).json({ error: 'РЈРєР°Р¶РёС‚Рµ РєРѕСЂСЂРµРєС‚РЅСѓСЋ С†РµРЅСѓ РїСЂРµРґР»РѕР¶РµРЅРёСЏ' });
    }

    const note = String(req.body?.note || '').trim();
    const buyer = await User.findByPk(req.user.id, { attributes: ['id', 'name'] });
    const buyerName = buyer?.name || 'РџРѕРєСѓРїР°С‚РµР»СЊ';
    const offerMessage = `РџСЂРµРґР»РѕР¶РµРЅРёРµ С†РµРЅС‹: ${formatSom(offeredPrice)} СЃРѕРј${note ? `\nРљРѕРјРјРµРЅС‚Р°СЂРёР№: ${note}` : ''}`;

    const [chat] = await Chat.findOrCreate({
      where: { buyerId: req.user.id, sellerId: ad.userId, adId: ad.id },
      defaults: { buyerId: req.user.id, sellerId: ad.userId, adId: ad.id },
    });

    const message = await Message.create({
      chatId: chat.id,
      senderId: req.user.id,
      text: offerMessage,
      imageUrl: null,
    });

    const notification = await Notification.create({
      userId: ad.userId,
      type: 'price_offer',
      title: 'РќРѕРІРѕРµ РїСЂРµРґР»РѕР¶РµРЅРёРµ С†РµРЅС‹',
      text: `${buyerName} РїСЂРµРґР»РѕР¶РёР»(Р°) ${formatSom(offeredPrice)} СЃРѕРј Р·Р° "${ad.title}"`,
      data: {
        adId: ad.id,
        chatId: chat.id,
        buyerId: req.user.id,
        buyerName,
        offeredPrice,
      },
      isRead: false,
    });

    const io = req.app.get('io');
    io?.to(String(chat.id)).emit('newMessage', {
      id: message.id,
      chatId: Number(chat.id),
      senderId: Number(req.user.id),
      text: message.text,
      imageUrl: null,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      Sender: { id: req.user.id, name: buyerName },
    });
    io?.to(`user:${ad.userId}`).emit('newNotification', notification);
    await sendTelegramNotification(
      `<b>РќРѕРІРѕРµ РїСЂРµРґР»РѕР¶РµРЅРёРµ С†РµРЅС‹</b>\n${buyerName} РїСЂРµРґР»РѕР¶РёР»(Р°) ${formatSom(offeredPrice)} СЃРѕРј Р·Р° "${ad.title}"`
    );

    res.json({
      success: true,
      chatId: chat.id,
      message: 'РџСЂРµРґР»РѕР¶РµРЅРёРµ РѕС‚РїСЂР°РІР»РµРЅРѕ РїСЂРѕРґР°РІС†Сѓ',
      notificationId: notification.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, upload.array('images', 20), async (req, res) => {
  try {
    const { title, description, price, category, city, phone, meta } = req.body;

    // РђРІС‚РѕРїСЂРѕРІРµСЂРєР° вЂ” РµСЃР»Рё Р·Р°РїСЂРµС‰С‘РЅРЅС‹Рµ СЃР»РѕРІР°, СЃСЂР°Р·Сѓ РѕС‚РєР»РѕРЅСЏРµРј
    if (containsBannedWords(title) || containsBannedWords(description)) {
      // РЈРґР°Р»СЏРµРј Р·Р°РіСЂСѓР¶РµРЅРЅС‹Рµ С„Р°Р№Р»С‹
      if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch(e){} });
      return res.status(400).json({ error: 'РћР±СЉСЏРІР»РµРЅРёРµ СЃРѕРґРµСЂР¶РёС‚ Р·Р°РїСЂРµС‰С‘РЅРЅС‹Рµ СЃР»РѕРІР° Рё РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ РѕРїСѓР±Р»РёРєРѕРІР°РЅРѕ' });
    }

    const tryParseJson = (value) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (_e) {
        return value;
      }
    };

    // РЎРѕР±РёСЂР°РµРј РјРµС‚Р°РґР°РЅРЅС‹Рµ (РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ) вЂ” РѕС‚РґРµР»СЊРЅРѕ Рё РёР· body, Рё РёР· РїРѕР»СЏ meta
    const knownFields = ['title', 'description', 'price', 'category', 'city', 'phone', 'meta'];
    const incomingMeta = tryParseJson(meta);
    const extraMeta = Object.keys(req.body).reduce((acc, key) => {
      if (!knownFields.includes(key)) {
        acc[key] = tryParseJson(req.body[key]);
      }
      return acc;
    }, {});
    const finalMeta = { ...((typeof incomingMeta === 'object' && incomingMeta !== null) ? incomingMeta : {}), ...extraMeta };
    let imageUrls = [];
    const uploadErrors = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'lekofy'
          });
          imageUrls.push(result.secure_url);
        } catch (uploadErr) {
          console.error('Ошибка загрузки фото:', uploadErr.message);
          uploadErrors.push(uploadErr.message);
        } finally {
          try { fs.unlinkSync(file.path); } catch (_e) {}
        }
      }
    }

    if (req.files && req.files.length > 0 && imageUrls.length === 0) {
      return res.status(500).json({
        error: 'Не удалось загрузить фото. Проверьте Cloudinary переменные окружения на Render.',
      });
    }

    // Чисто — сразу публикуем (status: 'active')
    const ad = await Ad.create({
      title,
      description,
      price: parseFloat(price),
      category,
      city,
      phone,
      meta: finalMeta,
      images: imageUrls,
      status: 'active',
      userId: req.user.id,
    });
    res.json({
      ...ad.toJSON(),
      message: 'Объявление опубликовано!',
      ...(uploadErrors.length > 0 ? { imageWarnings: uploadErrors } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Р–Р°Р»РѕР±Р° вЂ” СЃРѕР·РґР°С‘Рј Рё СѓРІРµРґРѕРјР»СЏРµРј Р°РґРјРёРЅРѕРІ
router.post('/:id/report', auth, async (req, res) => {
  try {
    const reason = (req.body && req.body.reason) ? String(req.body.reason).trim() : '';
    if (!reason) return res.status(400).json({ error: 'РЈРєР°Р¶РёС‚Рµ РїСЂРёС‡РёРЅСѓ Р¶Р°Р»РѕР±С‹' });

    const adId = parseInt(req.params.id, 10);
    if (isNaN(adId)) return res.status(400).json({ error: 'РќРµРІРµСЂРЅС‹Р№ ID РѕР±СЉСЏРІР»РµРЅРёСЏ' });

    const ad = await Ad.findByPk(adId);
    if (!ad) return res.status(404).json({ error: 'РћР±СЉСЏРІР»РµРЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ' });

    const report = await Report.create({
      reason,
      status: 'pending',
      reporterId: req.user.id,
      adId,
    });

    try {
      const io = req.app && req.app.get ? req.app.get('io') : null;
      if (io) io.emit('newReport', { id: report.id, adId, adTitle: ad.title, reason });
    } catch (e) { /* РёРіРЅРѕСЂ РѕС€РёР±РѕРє socket */ }

    res.json({ id: report.id, adId, reason: report.reason, message: 'Р–Р°Р»РѕР±Р° РѕС‚РїСЂР°РІР»РµРЅР° РјРѕРґРµСЂР°С‚РѕСЂР°Рј' });
  } catch (err) {
    console.error('РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ Р¶Р°Р»РѕР±С‹:', err);
    res.status(500).json({ error: err.message || 'РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё Р¶Р°Р»РѕР±С‹' });
  }
});

router.put('/:id', auth, upload.array('images', 20), async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ error: 'РќРµ РЅР°Р№РґРµРЅРѕ' });
    if (ad.userId !== req.user.id) return res.status(403).json({ error: 'РќРµС‚ РґРѕСЃС‚СѓРїР°' });
    // Р Р°Р·СЂРµС€Р°РµРј С‚РѕР»СЊРєРѕ СЌС‚Рё РїРѕР»СЏ вЂ” СЃС‚Р°С‚СѓСЃ РќР• РјРµРЅСЏРµРј (РѕСЃС‚Р°С‘С‚СЃСЏ active)
    const { title, description, price, category, city, phone, images, meta } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;
    if (city !== undefined) updates.city = city;
    if (phone !== undefined) updates.phone = phone;

    const tryParseJson = (value) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (_e) {
        return value;
      }
    };

    // Р•СЃР»Рё РїСЂРёС€Р»Рё РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ, СЃРѕС…СЂР°РЅСЏРµРј РёС… РІ meta
    const knownFields = ['title', 'description', 'price', 'category', 'city', 'phone', 'images', 'meta'];
    const incomingMeta = tryParseJson(meta);
    const extraMeta = Object.keys(req.body).reduce((acc, key) => {
      if (!knownFields.includes(key)) {
        acc[key] = tryParseJson(req.body[key]);
      }
      return acc;
    }, {});
    const mergedMeta = { ...(ad.meta || {}), ...((typeof incomingMeta === 'object' && incomingMeta !== null) ? incomingMeta : {}), ...extraMeta };
    updates.meta = mergedMeta;

    const normalizeStringArray = (value) => {
      if (value === undefined || value === null) return undefined;
      if (Array.isArray(value)) return value.filter(Boolean);
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch (_e) {
          return [trimmed];
        }
      }
      return [];
    };

    const keepImages = normalizeStringArray(req.body.existingImages);
    const incomingImages = normalizeStringArray(images);

    const uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'lekofy',
          });
          uploadedUrls.push(result.secure_url);
        } finally {
          try { fs.unlinkSync(file.path); } catch (_e) {}
        }
      }
    }

    if (keepImages !== undefined || incomingImages !== undefined || uploadedUrls.length > 0) {
      const baseImages = keepImages !== undefined
        ? keepImages
        : (incomingImages !== undefined ? incomingImages : (Array.isArray(ad.images) ? ad.images : []));
      updates.images = [...baseImages, ...uploadedUrls];
    }

    await ad.update(updates);
    res.json(ad);
  } catch (err) {
    if (req.files && req.files.length > 0) {
      req.files.forEach((f) => { try { fs.unlinkSync(f.path); } catch (_e) {} });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ error: 'РќРµ РЅР°Р№РґРµРЅРѕ' });
    if (ad.userId !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ error: 'РќРµС‚ РґРѕСЃС‚СѓРїР°' });
    }
    await ad.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



