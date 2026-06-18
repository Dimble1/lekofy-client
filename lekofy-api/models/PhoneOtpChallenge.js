const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhoneOtpChallenge = sequelize.define('PhoneOtpChallenge', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  challengeId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(32), allowNull: false },
  purpose: {
    type: DataTypes.ENUM('login', 'register', 'reset_password'),
    allowNull: false,
    defaultValue: 'login',
  },
  otpHash: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'expired', 'locked', 'superseded'),
    allowNull: false,
    defaultValue: 'pending',
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lastSentAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verifiedIp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verifiedUserAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deliveryProvider: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'local',
  },
  deliveredTo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  indexes: [
    { fields: ['challengeId'] },
    { fields: ['phone'] },
    { fields: ['status'] },
    { fields: ['expiresAt'] },
  ],
});

module.exports = PhoneOtpChallenge;
