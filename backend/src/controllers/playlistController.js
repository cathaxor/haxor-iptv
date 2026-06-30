const fs = require('fs');
const https = require('https');
const http = require('http');
const db = require('../config/database');
const cache = require('../utils/cache');
const { parseM3U, extractGroups } = require('../utils/m3uParser');
const logger = require('../utils/logger');

async function getPlaylists(req, res) {
  try {
    const playlists = await db.query(
      'SELECT * FROM playlists ORDER BY created_at DESC'
    );
    res.json(playlists);
  } catch (err) {
    logger.error('Get playlists error:', err.message);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
}

async function getPlaylist(req, res) {
  try {
    const playlist = await db.queryOne('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (err) {
    logger.error('Get playlist error:', err.message);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
}

async function uploadPlaylist(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, auto_refresh, refresh_interval } = req.body;
    const playlistName = name || req.file.originalname.replace(/\.[^.]+$/, '');

    const channels = await parseM3U(req.file.path);

    const result = await db.execute(
      `INSERT INTO playlists (name, source_type, file_path, auto_refresh, refresh_interval, channel_count, created_by)
       VALUES (?, 'file', ?, ?, ?, ?, ?)`,
      [
        playlistName,
        req.file.path,
        auto_refresh === 'true' || auto_refresh === true ? 1 : 0,
        parseInt(refresh_interval, 10) || 3600,
        channels.length,
        req.user.id,
      ]
    );

    const playlistId = Number(result.insertId);
    await importChannels(playlistId, channels);

    cache.delByPattern('channels');
    cache.delByPattern('categories');

    await db.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'upload_playlist', 'playlist', playlistId, JSON.stringify({ channels: channels.length }), req.ip]
    );

    res.status(201).json({
      id: playlistId,
      name: playlistName,
      channels: channels.length,
      groups: extractGroups(channels),
    });
  } catch (err) {
    logger.error('Upload playlist error:', err.message);
    res.status(500).json({ error: 'Failed to process playlist' });
  }
}

async function importPlaylistUrl(req, res) {
  try {
    const { url, name, auto_refresh, refresh_interval } = req.body;

    if (!url) return res.status(400).json({ error: 'URL is required' });

    const content = await fetchUrl(url);
    const channels = await parseM3U(content);
    const playlistName = name || 'Imported Playlist';

    const result = await db.execute(
      `INSERT INTO playlists (name, source_type, source_url, auto_refresh, refresh_interval, channel_count, created_by)
       VALUES (?, 'url', ?, ?, ?, ?, ?)`,
      [
        playlistName,
        url,
        auto_refresh ? 1 : 0,
        parseInt(refresh_interval, 10) || 3600,
        channels.length,
        req.user.id,
      ]
    );

    const playlistId = Number(result.insertId);
    await importChannels(playlistId, channels);

    cache.delByPattern('channels');
    cache.delByPattern('categories');

    await db.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'import_playlist_url', 'playlist', playlistId, JSON.stringify({ url, channels: channels.length }), req.ip]
    );

    res.status(201).json({
      id: playlistId,
      name: playlistName,
      channels: channels.length,
      groups: extractGroups(channels),
    });
  } catch (err) {
    logger.error('Import playlist URL error:', err.message);
    res.status(500).json({ error: 'Failed to import playlist from URL' });
  }
}

async function refreshPlaylist(req, res) {
  try {
    const playlist = await db.queryOne('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    if (playlist.source_type !== 'url' || !playlist.source_url) {
      return res.status(400).json({ error: 'Only URL-based playlists can be refreshed' });
    }

    const content = await fetchUrl(playlist.source_url);
    const channels = await parseM3U(content);

    await db.execute('DELETE FROM channels WHERE playlist_id = ?', [playlist.id]);
    await importChannels(playlist.id, channels);

    await db.execute(
      'UPDATE playlists SET channel_count = ?, last_refreshed = NOW(), status = ? WHERE id = ?',
      [channels.length, 'active', playlist.id]
    );

    cache.delByPattern('channels');
    cache.delByPattern('categories');

    res.json({ message: 'Playlist refreshed', channels: channels.length });
  } catch (err) {
    logger.error('Refresh playlist error:', err.message);
    await db.execute(
      'UPDATE playlists SET status = ?, error_message = ? WHERE id = ?',
      ['error', err.message, req.params.id]
    );
    res.status(500).json({ error: 'Failed to refresh playlist' });
  }
}

async function deletePlaylist(req, res) {
  try {
    await db.execute('DELETE FROM playlists WHERE id = ?', [req.params.id]);
    cache.delByPattern('channels');
    cache.delByPattern('categories');
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    logger.error('Delete playlist error:', err.message);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
}

async function importChannels(playlistId, channels) {
  if (channels.length === 0) return;

  for (let i = 0; i < channels.length; i += 500) {
    const batch = channels.slice(i, i + 500);
    const values = [];
    const placeholders = [];

    for (const ch of batch) {
      let categoryId = null;
      if (ch.group_title) {
        const slug = ch.group_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existing = await db.queryOne('SELECT id FROM categories WHERE slug = ?', [slug]);
        if (existing) {
          categoryId = existing.id;
        } else {
          const catResult = await db.execute(
            'INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)',
            [ch.group_title, slug, 999]
          );
          categoryId = Number(catResult.insertId);
        }
      }

      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      values.push(
        playlistId, categoryId, ch.name, ch.stream_url,
        ch.logo_url, ch.epg_id, ch.tvg_name, ch.tvg_language,
        ch.tvg_country, ch.group_title, ch.quality
      );
    }

    await db.execute(
      `INSERT INTO channels (playlist_id, category_id, name, stream_url, logo_url, epg_id, tvg_name, tvg_language, tvg_country, group_title, quality)
       VALUES ${placeholders.join(', ')}`,
      values
    );
  }

  // Update category channel counts
  await db.execute(
    `UPDATE categories c SET channel_count = (SELECT COUNT(*) FROM channels ch WHERE ch.category_id = c.id AND ch.is_active = 1)`
  );
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { timeout: 30000, headers: { 'User-Agent': 'HaxorIPTV/1.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchUrl(response.headers.location).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => resolve(data));
      response.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => { request.destroy(); reject(new Error('Request timeout')); });
  });
}

module.exports = {
  getPlaylists, getPlaylist, uploadPlaylist, importPlaylistUrl,
  refreshPlaylist, deletePlaylist, fetchUrl,
};
