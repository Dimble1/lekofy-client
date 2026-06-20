const { Sequelize } = require('sequelize');
require('dotenv').config();

const connectionUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error(
    'Missing database configuration. Set POSTGRES_URL_NON_POOLING, POSTGRES_URL, SUPABASE_DATABASE_URL, or DATABASE_URL.'
  );
}

const isProduction = process.env.NODE_ENV === 'production';
const shouldUseSsl =
  isProduction || connectionUrl?.includes('sslmode=require');

const commonOptions = {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    family: 4,
    ssl: shouldUseSsl
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : false,
  },
};

const sequelize = connectionUrl
  ? new Sequelize(connectionUrl, commonOptions)
  : null;

module.exports = sequelize;
