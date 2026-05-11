const dotenv = require('dotenv')
dotenv.config();

const dbConfig = exports.dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  database: process.env.DB_NAME || 'bzsoluti_m_salon',
  username: process.env.DB_USER || 'bzsoluti_m_user',
  password: process.env.DB_PASS || 'm_user_123!',
  dialect: 'mysql',
  logging: false
};
