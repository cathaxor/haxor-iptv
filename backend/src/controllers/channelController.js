const db = require('../config/database');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

async function getChannels(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = (page - 1) * limit;
    const { category, search, quality, playlist_id } = req.query;

    const cacheKey = `channels:${page}:${limit}:${category || ''}:${search || ''}:${quality || ''}:${playlist_id || ''}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    let where = 'ch.is_active = 1';
    const params = [];

    if (category) {
      where += ' AND c.slug = ?';
      params.push(category);
    }
    if (search) {
      where += ' AND MATCH(ch.name) AGAINST(? IN BOOLEAN MODE)';
      params.push(`*${search}*`);
    }
    if (quality) {
      where += ' AND ch.quality = ?';
      params.push(quality);
    }
    if (playlist_id) {
      where += ' AND ch.playlist_id = ?';
      params.push(playlist_id);
    }

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM channels ch LEFT JOIN categories c ON ch.category_id = c.id WHERE ${where}`,
      params
    );
    const total = Number(countResult.total);

    const channels = await db.query(
      `SELECT ch.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
       FROM channels ch
       LEFT JOIN categories c ON ch.category_id = c.id
       WHERE ${where}
       ORDER BY ch.sort_order ASC, ch.name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const result = {
      channels,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (err) {
    logger.error('Get channels error:', err.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
}

async function getChannel(req, res) {
  try {
    const channel = await db.queryOne(
      `SELECT ch.*, c.name as category_name, c.slug as category_slug
       FROM channels ch LEFT JOIN categories c ON ch.category_id = c.id
       WHERE ch.id = ?`,
      [req.params.id]
    );
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel);
  } catch (err) {
    logger.error('Get channel error:', err.message);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
}

async function updateChannel(req, res) {
  try {
    const { name, stream_url, logo_url, epg_id, category_id, is_active, sort_order, quality } = req.body;
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (stream_url) { updates.push('stream_url = ?'); params.push(stream_url); }
    if (logo_url !== undefined) { updates.push('logo_url = ?'); params.push(logo_url); }
    if (epg_id !== undefined) { updates.push('epg_id = ?'); params.push(epg_id); }
    if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
    if (typeof is_active !== 'undefined') { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
    if (quality !== undefined) { updates.push('quality = ?'); params.push(quality); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    params.push(req.params.id);
    await db.execute(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`, params);
    cache.delByPattern('channels');

    res.json({ message: 'Channel updated' });
  } catch (err) {
    logger.error('Update channel error:', err.message);
    res.status(500).json({ error: 'Failed to update channel' });
  }
}

async function deleteChannel(req, res) {
  try {
    await db.execute('DELETE FROM channels WHERE id = ?', [req.params.id]);
    cache.delByPattern('channels');
    res.json({ message: 'Channel deleted' });
  } catch (err) {
    logger.error('Delete channel error:', err.message);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
}

async function searchChannels(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const channels = await db.query(
      `SELECT ch.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
       FROM channels ch
       LEFT JOIN categories c ON ch.category_id = c.id
       WHERE ch.is_active = 1 AND ch.name LIKE ?
       ORDER BY ch.name ASC
       LIMIT 50`,
      [`%${q}%`]
    );

    res.json({ channels, total: channels.length });
  } catch (err) {
    logger.error('Search channels error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
}

module.exports = { getChannels, getChannel, updateChannel, deleteChannel, searchChannels };
