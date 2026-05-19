 const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  chatId: { type: DataTypes.INTEGER, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: true },
  imageUrl: { type: DataTypes.TEXT, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Message;
