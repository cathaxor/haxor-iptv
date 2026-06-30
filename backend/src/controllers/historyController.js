const db = require('../config/database');
const logger = require('../utils/logger');

async function getHistory(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const history = await db.query(
      `SELECT wh.id, wh.watched_at, wh.duration,
              ch.id as channel_id, ch.name, ch.stream_url, ch.logo_url, ch.quality,
              c.name as category_name, c.slug as category_slug, c.icon as category_icon
       FROM watch_history wh
       JOIN channels ch ON wh.channel_id = ch.id
       LEFT JOIN categories c ON ch.category_id = c.id
       WHERE wh.user_id = ?
       ORDER BY wh.watched_at DESC
       LIMIT ?`,
      [req.user.id, limit]
    );
    res.json(history);
  } catch (err) {
    logger.error('Get history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

async function addHistory(req, res) {
  try {
    const { channel_id, duration } = req.body;
    if (!channel_id) return res.status(400).json({ error: 'Channel ID is required' });

    await db.execute(
      'INSERT INTO watch_history (user_id, channel_id, duration) VALUES (?, ?, ?)',
      [req.user.id, channel_id, duration || 0]
    );

    const maxItems = 100;
    await db.execute(
      `DELETE FROM watch_history WHERE user_id = ? AND id NOT IN (
        SELECT id FROM (SELECT id FROM watch_history WHERE user_id = ? ORDER BY watched_at DESC LIMIT ?) sub
      )`,
      [req.user.id, req.user.id, maxItems]
    );

    res.status(201).json({ message: 'History recorded' });
  } catch (err) {
    logger.error('Add history error:', err.message);
    res.status(500).json({ error: 'Failed to record history' });
  }
}

async function clearHistory(req, res) {
  try {
    await db.execute('DELETE FROM watch_history WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'History cleared' });
  } catch (err) {
    logger.error('Clear history error:', err.message);
    res.status(500).json({ error: 'Failed to clear history' });
  }
}

module.exports = { getHistory, addHistory, clearHistory };
