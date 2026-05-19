const router = require('express').Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Ad = require('../models/Ad');
const { Op } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: 'uploads/' });
const TYPING_TTL_MS = 5000;
const typingState = new Map();

const assertChatMember = async (chatId, userId) => {
  const chat = await Chat.findByPk(chatId);
  if (!chat) {
    return { error: { status: 404, message: 'Чат не найден' } };
  }

  const isMember = Number(chat.buyerId) === Number(userId) || Number(chat.sellerId) === Number(userId);
  if (!isMember) {
    return { error: { status: 403, message: 'Нет доступа к чату' } };
  }

  return { chat };
};

const getTypingMap = (chatId) => {
  const key = String(chatId);
  const existing = typingState.get(key);
  if (existing) return existing;
  const created = new Map();
  typingState.set(key, created);
  return created;
};

const cleanupTyping = (chatId) => {
  const key = String(chatId);
  const map = typingState.get(key);
  if (!map) return [];

  const now = Date.now();
  for (const [userId, expiresAt] of map.entries()) {
    if (expiresAt <= now) {
      map.delete(userId);
    }
  }

  if (map.size === 0) {
    typingState.delete(key);
    return [];
  }

  return Array.from(map.keys()).map((id) => Number(id));
};

// Получить список чатов
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { buyerId: req.user.id },
          { sellerId: req.user.id },
        ],
      },
      include: [
        { model: Ad, as: 'Ad', attributes: ['id', 'title'], required: false },
        { model: User, as: 'Buyer', attributes: ['id', 'name'], required: false },
        { model: User, as: 'Seller', attributes: ['id', 'name'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать или найти чат
router.post('/', auth, async (req, res) => {
  try {
    const { sellerId, adId } = req.body;
    const normalizedAdId = adId == null ? null : adId;
    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId обязателен' });
    }
    if (Number(sellerId) === Number(req.user.id)) {
      return res.status(400).json({ error: 'Нельзя создать чат с самим собой' });
    }

    if (normalizedAdId) {
      const ad = await Ad.findByPk(normalizedAdId, { attributes: ['id', 'userId'] });
      if (!ad) {
        return res.status(404).json({ error: 'Объявление не найдено' });
      }
      if (Number(ad.userId) !== Number(sellerId)) {
        return res.status(400).json({ error: 'Неверный продавец для объявления' });
      }
    }

    const existing = await Chat.findOne({
      where: { buyerId: req.user.id, sellerId, adId: normalizedAdId },
    });
    if (existing) return res.json(existing);

    const chat = await Chat.create({ buyerId: req.user.id, sellerId, adId: normalizedAdId });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить сообщения чата
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const access = await assertChatMember(req.params.chatId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const messages = await Message.findAll({
      where: { chatId: req.params.chatId },
      include: [{ model: User, as: 'Sender', attributes: ['id', 'name'], required: false }],
      order: [['createdAt', 'ASC']],
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отправить текстовое сообщение
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const access = await assertChatMember(req.params.chatId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const text = req.body.text || req.body.content;
    if (!text) return res.status(400).json({ error: 'Текст сообщения обязателен' });

    const message = await Message.create({
      chatId: req.params.chatId,
      senderId: req.user.id,
      text,
      imageUrl: null,
    });

    const withSender = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'Sender', attributes: ['id', 'name'], required: false }],
    });
    res.json(withSender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отправить фото в чат (только фото)
router.post('/:chatId/messages/image', auth, upload.single('image'), async (req, res) => {
  try {
    const access = await assertChatMember(req.params.chatId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Фото не передано' });
    }

    if (!String(req.file.mimetype || '').startsWith('image/')) {
      try { fs.unlinkSync(req.file.path); } catch (_e) {}
      return res.status(400).json({ error: 'Разрешено отправлять только фото' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      upload_preset: 'ml_default',
      folder: 'lekofy/chat',
    });

    try { fs.unlinkSync(req.file.path); } catch (_e) {}

    const message = await Message.create({
      chatId: req.params.chatId,
      senderId: req.user.id,
      text: null,
      imageUrl: result.secure_url,
    });

    const withSender = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'Sender', attributes: ['id', 'name'], required: false }],
    });

    res.json(withSender);
  } catch (err) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_e) {}
    }
    res.status(500).json({ error: err.message });
  }
});

// Отметить сообщения чата как прочитанные текущим пользователем
router.post('/:chatId/read', auth, async (req, res) => {
  try {
    const access = await assertChatMember(req.params.chatId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const [updatedCount] = await Message.update(
      { isRead: true },
      {
        where: {
          chatId: req.params.chatId,
          senderId: { [Op.ne]: req.user.id },
          isRead: false,
        },
      },
    );

    const io = req.app.get('io');
    io?.to(String(req.params.chatId)).emit('messagesRead', {
      chatId: Number(req.params.chatId),
      readerId: Number(req.user.id),
    });

    res.json({ updatedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Установить статус "печатает"
router.post('/:chatId/typing', auth, async (req, res) => {
  try {
    const access = await assertChatMember(req.params.chatId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const isTyping = Boolean(req.body?.isTyping);
    const map = getTypingMap(req.params.chatId);
    const userKey = String(req.user.id);
    if (isTyping) {
      map.set(userKey, Date.now() + TYPING_TTL_MS);
    } else {
      map.delete(userKey);
    }

    const userIds = cleanupTyping(req.params.chatId);
    const io = req.app.get('io');
    io?.to(String(req.params.chatId)).emit('typing', {
      chatId: Number(req.params.chatId),
      userIds,
    });

    res.json({ ok: true, userIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить текущий список пользователей, которые печатают
router.get('/:chatId/typing', auth, async (req, res) => {
  try {
    const access = await assertChatMember(req.params.chatId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const userIds = cleanupTyping(req.params.chatId).filter((id) => Number(id) !== Number(req.user.id));
    res.json({ userIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
