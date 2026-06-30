const db = require('../config/database');
const logger = require('../utils/logger');

async function getFavorites(req, res) {
  try {
    const favorites = await db.query(
      `SELECT f.id, f.created_at as favorited_at,
              ch.id as channel_id, ch.name, ch.stream_url, ch.logo_url, ch.epg_id, ch.quality,
              c.name as category_name, c.slug as category_slug, c.icon as category_icon
       FROM favorites f
       JOIN channels ch ON f.channel_id = ch.id
       LEFT JOIN categories c ON ch.category_id = c.id
       WHERE f.user_id = ? AND ch.is_active = 1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(favorites);
  } catch (err) {
    logger.error('Get favorites error:', err.message);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
}

async function addFavorite(req, res) {
  try {
    const { channel_id } = req.body;
    if (!channel_id) return res.status(400).json({ error: 'Channel ID is required' });

    const channel = await db.queryOne('SELECT id FROM channels WHERE id = ?', [channel_id]);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const existing = await db.queryOne(
      'SELECT id FROM favorites WHERE user_id = ? AND channel_id = ?',
      [req.user.id, channel_id]
    );
    if (existing) return res.status(409).json({ error: 'Already in favorites' });

    await db.execute(
      'INSERT INTO favorites (user_id, channel_id) VALUES (?, ?)',
      [req.user.id, channel_id]
    );

    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    logger.error('Add favorite error:', err.message);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
}

async function removeFavorite(req, res) {
  try {
    await db.execute(
      'DELETE FROM favorites WHERE user_id = ? AND channel_id = ?',
      [req.user.id, req.params.channelId]
    );
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    logger.error('Remove favorite error:', err.message);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
}

async function checkFavorite(req, res) {
  try {
    const fav = await db.queryOne(
      'SELECT id FROM favorites WHERE user_id = ? AND channel_id = ?',
      [req.user.id, req.params.channelId]
    );
    res.json({ isFavorite: !!fav });
  } catch (err) {
    logger.error('Check favorite error:', err.message);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
}

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
