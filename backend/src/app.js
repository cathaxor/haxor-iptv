const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { startScheduler } = require('./services/scheduler');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const channelRoutes = require('./routes/channelRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const historyRoutes = require('./routes/historyRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const epgRoutes = require('./routes/epgRoutes');

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.env === 'production'
    ? config.cors.origin
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.env !== 'production') {
  app.use(morgan('dev'));
} else {
  const accessLogStream = fs.createWriteStream(
    path.join(config.log.dir, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
}

// Static files
const uploadsPath = config.upload.dir;
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbOk = await db.testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: config.env,
      database: dbOk ? 'connected' : 'disconnected',
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      },
    });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// Dashboard stats (admin)
app.get('/api/dashboard', require('./middleware/auth').authenticate, require('./middleware/auth').authorize('admin'), async (req, res) => {
  try {
    const [users, channels, playlists, categories] = await Promise.all([
      db.queryOne('SELECT COUNT(*) as count FROM users'),
      db.queryOne('SELECT COUNT(*) as count FROM channels WHERE is_active = 1'),
      db.queryOne('SELECT COUNT(*) as count FROM playlists'),
      db.queryOne('SELECT COUNT(*) as count FROM categories WHERE is_visible = 1'),
    ]);

    const recentActivity = await db.query(
      `SELECT al.*, u.username FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT 20`
    );

    const playlistStats = await db.query(
      "SELECT status, COUNT(*) as count FROM playlists GROUP BY status"
    );

    res.json({
      stats: {
        users: Number(users.count),
        channels: Number(channels.count),
        playlists: Number(playlists.count),
        categories: Number(categories.count),
      },
      recentActivity,
      playlistStats,
    });
  } catch (err) {
    logger.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Activity logs (admin)
app.get('/api/logs', require('./middleware/auth').authenticate, require('./middleware/auth').authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = (page - 1) * limit;

    const countResult = await db.queryOne('SELECT COUNT(*) as total FROM activity_logs');
    const total = Number(countResult.total);

    const logs = await db.query(
      `SELECT al.*, u.username FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('Logs error:', err.message);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/epg', epgRoutes);

// Error handling
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      logger.error('Cannot connect to database. Exiting...');
      process.exit(1);
    }

    startScheduler();

    app.listen(config.port, config.host, () => {
      logger.info(`Haxor IPTV API running on ${config.host}:${config.port} [${config.env}]`);
      if (typeof process.send === 'function') {
        process.send('ready');
      }
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await db.pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down...');
  await db.pool.end();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

startServer();

module.exports = app;
