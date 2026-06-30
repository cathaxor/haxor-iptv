const db = require('../config/database');
const cache = require('../utils/cache');
const { parseXMLTV } = require('../utils/xmltvParser');
const { fetchUrl } = require('./playlistController');
const logger = require('../utils/logger');

async function getEpgSources(req, res) {
  try {
    const sources = await db.query('SELECT * FROM epg_sources ORDER BY created_at DESC');
    res.json(sources);
  } catch (err) {
    logger.error('Get EPG sources error:', err.message);
    res.status(500).json({ error: 'Failed to fetch EPG sources' });
  }
}

async function importEpg(req, res) {
  try {
    const { url, name } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const epgName = name || 'EPG Source';

    const content = await fetchUrl(url);
    const { channels, programs } = await parseXMLTV(content);

    const result = await db.execute(
      `INSERT INTO epg_sources (name, url, program_count, last_refreshed, status)
       VALUES (?, ?, ?, NOW(), 'active')`,
      [epgName, url, programs.length]
    );
    const sourceId = Number(result.insertId);

    if (programs.length > 0) {
      for (let i = 0; i < programs.length; i += 1000) {
        const batch = programs.slice(i, i + 1000);
        const placeholders = [];
        const values = [];

        for (const prog of batch) {
          placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
          values.push(
            sourceId,
            prog.channel_epg_id,
            prog.title,
            prog.description || null,
            prog.start_time,
            prog.end_time,
            prog.category || null,
            prog.icon || null
          );
        }

        await db.execute(
          `INSERT INTO epg_programs (epg_source_id, channel_epg_id, title, description, start_time, end_time, category, icon)
           VALUES ${placeholders.join(', ')}`,
          values
        );
      }
    }

    cache.delByPattern('epg');

    res.status(201).json({
      id: sourceId,
      name: epgName,
      channels: Object.keys(channels).length,
      programs: programs.length,
    });
  } catch (err) {
    logger.error('Import EPG error:', err.message);
    res.status(500).json({ error: 'Failed to import EPG' });
  }
}

async function refreshEpg(req, res) {
  try {
    const source = await db.queryOne('SELECT * FROM epg_sources WHERE id = ?', [req.params.id]);
    if (!source) return res.status(404).json({ error: 'EPG source not found' });

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
            source.id,
            prog.channel_epg_id,
            prog.title,
            prog.description || null,
            prog.start_time,
            prog.end_time,
            prog.category || null,
            prog.icon || null
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
    res.json({ message: 'EPG refreshed', programs: programs.length });
  } catch (err) {
    logger.error('Refresh EPG error:', err.message);
    await db.execute(
      'UPDATE epg_sources SET status = ?, error_message = ? WHERE id = ?',
      ['error', err.message, req.params.id]
    );
    res.status(500).json({ error: 'Failed to refresh EPG' });
  }
}

async function getEpgPrograms(req, res) {
  try {
    const { channel_epg_id, date } = req.query;
    if (!channel_epg_id) return res.status(400).json({ error: 'channel_epg_id is required' });

    const cacheKey = `epg:${channel_epg_id}:${date || 'today'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    let where = 'channel_epg_id = ?';
    const params = [channel_epg_id];

    if (date) {
      where += ' AND DATE(start_time) = ?';
      params.push(date);
    } else {
      where += ' AND end_time >= NOW() AND start_time <= DATE_ADD(NOW(), INTERVAL 24 HOUR)';
    }

    const programs = await db.query(
      `SELECT * FROM epg_programs WHERE ${where} ORDER BY start_time ASC`,
      params
    );

    cache.set(cacheKey, programs, 300);
    res.json(programs);
  } catch (err) {
    logger.error('Get EPG programs error:', err.message);
    res.status(500).json({ error: 'Failed to fetch EPG programs' });
  }
}

async function deleteEpgSource(req, res) {
  try {
    await db.execute('DELETE FROM epg_sources WHERE id = ?', [req.params.id]);
    cache.delByPattern('epg');
    res.json({ message: 'EPG source deleted' });
  } catch (err) {
    logger.error('Delete EPG source error:', err.message);
    res.status(500).json({ error: 'Failed to delete EPG source' });
  }
}

module.exports = { getEpgSources, importEpg, refreshEpg, getEpgPrograms, deleteEpgSource };
