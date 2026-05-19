require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');

// Models
const User = require('./models/User');
const Ad = require('./models/Ad');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Favorite = require('./models/Favorite');
const Report = require('./models/Report');
const Notification = require('./models/Notification');

// Associations
Chat.belongsTo(User, { as: 'Buyer', foreignKey: 'buyerId' });
Chat.belongsTo(User, { as: 'Seller', foreignKey: 'sellerId' });
User.hasMany(Chat, { as: 'BuyerChats', foreignKey: 'buyerId' });
User.hasMany(Chat, { as: 'SellerChats', foreignKey: 'sellerId' });

Chat.belongsTo(Ad, { as: 'Ad', foreignKey: 'adId' });
Ad.hasMany(Chat, { foreignKey: 'adId' });

Message.belongsTo(Chat, { foreignKey: 'chatId' });
Chat.hasMany(Message, { foreignKey: 'chatId' });

Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'senderId' });

Report.belongsTo(User, { as: 'Reporter', foreignKey: 'reporterId' });
User.hasMany(Report, { as: 'Reports', foreignKey: 'reporterId' });

Report.belongsTo(Ad, { as: 'Ad', foreignKey: 'adId' });
Ad.hasMany(Report, { foreignKey: 'adId' });

Ad.belongsTo(User, { as: 'Owner', foreignKey: 'userId' });
User.hasMany(Ad, { as: 'Ads', foreignKey: 'userId' });

Notification.belongsTo(User, { as: 'Recipient', foreignKey: 'userId' });
User.hasMany(Notification, { as: 'Notifications', foreignKey: 'userId' });

// Routes
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const chatRoutes = require('./routes/chat');
const favoriteRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const { startTelegramBotPolling } = require('./services/telegramBot');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.set('io', io);
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/ping', (_req, res) => res.json({ message: 'Lekofy API работает!' }));

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  socket.on('joinRoom', (chatId) => {
    socket.join(String(chatId));
    console.log(`Пользователь зашел в чат: ${chatId}`);
  });

  socket.on('joinUser', (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
  });

  socket.on('sendMessage', (data) => {
    io.to(String(data.chatId)).emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('База данных подключена!');
    startTelegramBotPolling();
    server.listen(PORT, () => {
      console.log(`Lekofy API запущен на порту ${PORT}`);
    });
  })
  .catch((err) => console.error('Ошибка подключения к БД:', err));

