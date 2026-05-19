const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'system' },
  title: { type: DataTypes.STRING, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  data: { type: DataTypes.JSON, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

module.exports = Notification;
