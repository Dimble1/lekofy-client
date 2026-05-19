const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  avatar: { type: DataTypes.STRING },
  bio: { type: DataTypes.TEXT },
  role: { type: DataTypes.ENUM('user', 'moderator', 'admin'), defaultValue: 'user' },
  isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  banReason: { type: DataTypes.STRING, allowNull: true },
  banUntil: { type: DataTypes.DATE, allowNull: true },
  telegramChatId: { type: DataTypes.STRING, allowNull: true },
  telegramUsername: { type: DataTypes.STRING, allowNull: true },
  telegramEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  telegramConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = User;
