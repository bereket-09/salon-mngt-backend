import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
  url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_rAtWioa67UPS@ep-lucky-morning-aqjrz66l-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&uselibpqcompat=true',
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
