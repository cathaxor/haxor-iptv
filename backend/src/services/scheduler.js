const cron = require('node-cron');
const db = require('../config/database');
const { fetchUrl } = require('../controllers/playlistController');
const { parseM3U } = require('../utils/m3uParser');
const { parseXMLTV } = require('../utils/xmltvParser');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

function startScheduler() {
  // Refresh playlists every 15 minutes (check which ones need refresh)
  cron.schedule('*/15 * * * *', async () => {
    try {
      const playlists = await db.query(
        `SELECT * FROM playlists
         WHERE auto_refresh = 1 AND source_type = 'url' AND source_url IS NOT NULL
         AND (last_refreshed IS NULL OR TIMESTAMPDIFF(SECOND, last_refreshed, NOW()) >= refresh_interval)`
      );

      for (const playlist of playlists) {
        try {
          logger.info(`Auto-refreshing playlist: ${playlist.name} (ID: ${playlist.id})`);
          const content = await fetchUrl(playlist.source_url);
          const channels = await parseM3U(content);

          await db.execute('DELETE FROM channels WHERE playlist_id = ?', [playlist.id]);

          if (channels.length > 0) {
            for (let i = 0; i < channels.length; i += 500) {
              const batch = channels.slice(i, i + 500);
              const placeholders = [];
              const values = [];

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
                  playlist.id, categoryId, ch.name, ch.stream_url,
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
          }

          await db.execute(
            'UPDATE playlists SET channel_count = ?, last_refreshed = NOW(), status = ? WHERE id = ?',
            [channels.length, 'active', playlist.id]
          );

          await db.execute(
            `UPDATE categories c SET channel_count = (SELECT COUNT(*) FROM channels ch WHERE ch.category_id = c.id AND ch.is_active = 1)`
          );

          cache.delByPattern('channels');
          cache.delByPattern('categories');

          logger.info(`Playlist ${playlist.name} refreshed: ${channels.length} channels`);
        } catch (err) {
          logger.error(`Failed to refresh playlist ${playlist.name}:`, err.message);
          await db.execute(
            'UPDATE playlists SET status = ?, error_message = ? WHERE id = ?',
            ['error', err.message, playlist.id]
          );
        }
      }
    } catch (err) {
      logger.error('Playlist scheduler error:', err.message);
    }
  });

  // Refresh EPG sources every hour (check which ones need refresh)
  cron.schedule('0 * * * *', async () => {
    try {
      const sources = await db.query(
        `SELECT * FROM epg_sources
         WHERE auto_refresh = 1 AND status != 'inactive'
         AND (last_refreshed IS NULL OR TIMESTAMPDIFF(SECOND, last_refreshed, NOW()) >= refresh_interval)`
      );

      for (const source of sources) {
        try {
          logger.info(`Auto-refreshing EPG source: ${source.name} (ID: ${source.id})`);
          const content = await fetchUrl(source.url);
          const { programs } = await parseXMLTV(content);

          await db.execute('DELETE FROM epg_programs WHERE epg_source_id = ?', [source.id]);

          if (programs.length > 0) {
            for (let i = 0; i < programs.length; i += 1000) {
              const batch = programs.slice(i, i + 1000);
              const placeholders = [];
              const values = [];

              for (const prog of batch) {
                placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
                values.push(
                  source.id, prog.channel_epg_id, prog.title,
                  prog.description || null, prog.start_time, prog.end_time,
                  prog.category || null, prog.icon || null
                );
              }

              await db.execute(
                `INSERT INTO epg_programs (epg_source_id, channel_epg_id, title, description, start_time, end_time, category, icon)
                 VALUES ${placeholders.join(', ')}`,
                values
              );
            }
          }

          await db.execute(
            'UPDATE epg_sources SET program_count = ?, last_refreshed = NOW(), status = ? WHERE id = ?',
            [programs.length, 'active', source.id]
          );

          cache.delByPattern('epg');
          logger.info(`EPG source ${source.name} refreshed: ${programs.length} programs`);
        } catch (err) {
          logger.error(`Failed to refresh EPG source ${source.name}:`, err.message);
          await db.execute(
            'UPDATE epg_sources SET status = ?, error_message = ? WHERE id = ?',
            ['error', err.message, source.id]
          );
        }
      }
    } catch (err) {
      logger.error('EPG scheduler error:', err.message);
    }
  });

  // Clean old EPG data daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    try {
      const result = await db.execute(
        'DELETE FROM epg_programs WHERE end_time < DATE_SUB(NOW(), INTERVAL 2 DAY)'
      );
      logger.info(`Cleaned old EPG programs: ${result.affectedRows} removed`);
    } catch (err) {
      logger.error('EPG cleanup error:', err.message);
    }
  });

  // Clean old activity logs monthly
  cron.schedule('0 4 1 * *', async () => {
    try {
      const result = await db.execute(
        'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
      );
      logger.info(`Cleaned old activity logs: ${result.affectedRows} removed`);
    } catch (err) {
      logger.error('Log cleanup error:', err.message);
    }
  });

  logger.info('Scheduler started');
}

module.exports = { startScheduler };
