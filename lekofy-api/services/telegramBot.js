const axios = require('axios');
const User = require('../models/User');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

let lastUpdateId = 0;
let isPolling = false;

function getConnectLink(payload = 'connect') {
  if (!TELEGRAM_BOT_USERNAME) return '';
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(payload)}`;
}

async function sendBotMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN || !chatId || !text) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text,
    });
  } catch (error) {
    const details = error?.response?.data || error.message;
    console.error('Ошибка отправки ответа бота:', details);
  }
}

async function handleUpdate(update) {
  const message = update?.message;
  const text = message?.text || '';
  const chatId = message?.chat?.id;
  const firstName = message?.from?.first_name || 'пользователь';

  if (!chatId || !text.startsWith('/start')) return;

  const payload = text.split(' ')[1] || '';
  if (payload.startsWith('connect_')) {
    const userId = Number(payload.replace('connect_', ''));
    let lekofyName = '';

    if (Number.isFinite(userId) && userId > 0) {
      try {
        const user = await User.findByPk(userId, {
          attributes: ['id', 'name', 'telegramEnabled', 'telegramConfirmed'],
        });
        lekofyName = user?.name || '';
        if (user) {
          user.telegramChatId = String(chatId);
          user.telegramUsername = message?.from?.username || null;
          user.telegramConfirmed = true;
          user.telegramEnabled = true;
          await user.save();
        }
      } catch (error) {
        console.error('Ошибка получения пользователя Lekofy:', error.message);
      }
    }

    const replyText = `Приветствую уважаемый(ая) ${lekofyName || firstName} уведомление включено все уведомление будет отправляться сюда`;
    await sendBotMessage(chatId, replyText);
    return;
  }

  const replyText = `Приветствую уважаемый(ая) ${firstName} уведомление включено все уведомление будет отправляться сюда`;
  await sendBotMessage(chatId, replyText);
}

async function pollTelegramUpdates() {
  if (isPolling || !TELEGRAM_BOT_TOKEN) return;
  isPolling = true;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;

  while (isPolling) {
    try {
      const response = await axios.get(url, {
        params: {
          timeout: 25,
          offset: lastUpdateId + 1,
        },
      });

      const updates = response?.data?.result || [];
      for (const update of updates) {
        lastUpdateId = update.update_id;
        await handleUpdate(update);
      }
    } catch (error) {
      const details = error?.response?.data || error.message;
      console.error('Ошибка polling Telegram:', details);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

function startTelegramBotPolling() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN не задан: polling бота отключен');
    return;
  }

  pollTelegramUpdates().catch((err) => {
    console.error('Критическая ошибка Telegram polling:', err.message);
  });
}

module.exports = {
  getConnectLink,
  startTelegramBotPolling,
};
