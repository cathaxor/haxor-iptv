const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.example') });
if (require('fs').existsSync(path.resolve(__dirname, '../.env'))) {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME || 'haxor_iptv',
    user: process.env.DB_USER || 'haxor',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    minimumIdle: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    connectTimeout: 10000,
    idleTimeout: 60000,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 104857600,
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.resolve(__dirname, '../../logs'),
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
  },

  site: {
    url: process.env.SITE_URL || 'http://localhost:5173',
    name: process.env.SITE_NAME || 'Haxor IPTV',
  },
};

module.exports = config;
