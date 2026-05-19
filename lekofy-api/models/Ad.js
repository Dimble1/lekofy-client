const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ad = sequelize.define('Ad', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT, allowNull: false },
  category: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  images: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  meta: { type: DataTypes.JSON, defaultValue: {} },
  status: { type: DataTypes.ENUM('pending', 'active', 'rejected'), defaultValue: 'active' },
  views: { type: DataTypes.INTEGER, defaultValue: 0 },
  userId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  hooks: {
    beforeCreate: (ad) => { ad.status = 'active'; }, // всегда сразу активное
  },
});

module.exports = Ad;