const db = require('../config/database');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

async function getSettings(req, res) {
  try {
    const cacheKey = 'settings:all';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const rows = await db.query('SELECT key_name, value, type, description FROM settings');
    const settings = {};
    for (const row of rows) {
      let val = row.value;
      if (row.type === 'number') val = Number(val);
      else if (row.type === 'boolean') val = val === 'true';
      else if (row.type === 'json') { try { val = JSON.parse(val); } catch { /* keep string */ } }
      settings[row.key_name] = val;
    }

    cache.set(cacheKey, settings, 300);
    res.json(settings);
  } catch (err) {
    logger.error('Get settings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

async function updateSettings(req, res) {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    for (const [key, value] of Object.entries(updates)) {
      const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await db.execute(
        'UPDATE settings SET value = ? WHERE key_name = ?',
        [strValue, key]
      );
    }

    cache.del('settings:all');

    await db.execute(
      'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'update_settings', JSON.stringify({ keys: Object.keys(updates) }), req.ip]
    );

    res.json({ message: 'Settings updated' });
  } catch (err) {
    logger.error('Update settings error:', err.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

async function getPublicSettings(req, res) {
  try {
    const rows = await db.query(
      "SELECT key_name, value, type FROM settings WHERE key_name IN ('site_name', 'site_description', 'allow_registration', 'theme')"
    );
    const settings = {};
    for (const row of rows) {
      let val = row.value;
      if (row.type === 'boolean') val = val === 'true';
      settings[row.key_name] = val;
    }
    res.json(settings);
  } catch (err) {
    logger.error('Get public settings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

module.exports = { getSettings, updateSettings, getPublicSettings };
