 const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reporterId: { type: DataTypes.INTEGER, allowNull: false },
  adId: { type: DataTypes.INTEGER },
  userId: { type: DataTypes.INTEGER },
  reason: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'resolved', 'rejected'), defaultValue: 'pending' },
});

module.exports = Report;
