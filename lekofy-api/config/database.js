const { Sequelize } = require('sequelize');
require('dotenv').config();

const connectionUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL;

if (!connectionUrl) {
  throw new Error(
    'Missing database configuration. Set DATABASE_URL, SUPABASE_DATABASE_URL, POSTGRES_URL_NON_POOLING, or POSTGRES_URL.'
  );
}

const isProduction = process.env.NODE_ENV === 'production';
const shouldUseSsl = isProduction || /sslmode=(require|verify-ca|verify-full)/i.test(connectionUrl);

let normalizedConnectionUrl = connectionUrl;
try {
  const parsedUrl = new URL(connectionUrl);
  parsedUrl.searchParams.delete('sslmode');
  normalizedConnectionUrl = parsedUrl.toString();
} catch {
  normalizedConnectionUrl = connectionUrl;
}

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
  ? new Sequelize(normalizedConnectionUrl, commonOptions)
  : null;

module.exports = sequelize;
