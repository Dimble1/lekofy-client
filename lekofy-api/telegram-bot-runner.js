require('dotenv').config();
const { startTelegramBotPolling } = require('./services/telegramBot');

startTelegramBotPolling();
console.log('Telegram bot polling started');

setInterval(() => {}, 60_000);
