 const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  adId: { type: DataTypes.INTEGER },
  buyerId: { type: DataTypes.INTEGER, allowNull: false },
  sellerId: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = Chat;
