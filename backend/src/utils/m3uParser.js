const fs = require('fs');
const readline = require('readline');
const logger = require('./logger');

/**
 * Parse an M3U/M3U8 playlist file or string into structured channel data.
 * Supports EXTINF tags with tvg-* attributes and group-title.
 */
async function parseM3U(input) {
  const lines = [];

  if (typeof input === 'string' && !input.includes('\n') && fs.existsSync(input)) {
    const fileStream = fs.createReadStream(input, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    for await (const line of rl) {
      lines.push(line.trim());
    }
  } else {
    const rawLines = input.split(/\r?\n/);
    for (const l of rawLines) {
      lines.push(l.trim());
    }
  }

  if (lines.length === 0) {
    throw new Error('Empty M3U content');
  }

  const channels = [];
  let currentInfo = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTM3U')) {
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      currentInfo = parseExtInf(line);
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    if (line.length > 0 && (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp') || line.startsWith('/'))) {
      const channel = {
        name: currentInfo ? currentInfo.name : `Channel ${channels.length + 1}`,
        stream_url: line,
        logo_url: currentInfo ? currentInfo.tvgLogo : null,
        epg_id: currentInfo ? currentInfo.tvgId : null,
        tvg_name: currentInfo ? currentInfo.tvgName : null,
        tvg_language: currentInfo ? currentInfo.tvgLanguage : null,
        tvg_country: currentInfo ? currentInfo.tvgCountry : null,
        group_title: currentInfo ? currentInfo.groupTitle : null,
        quality: detectQuality(line, currentInfo ? currentInfo.name : ''),
      };
      channels.push(channel);
      currentInfo = null;
    }
  }

  logger.info(`M3U parsed successfully: ${channels.length} channels found`);
  return channels;
}

/**
 * Parse an #EXTINF line to extract metadata.
 */
function parseExtInf(line) {
  const result = {
    name: '',
    tvgId: null,
    tvgName: null,
    tvgLogo: null,
    tvgLanguage: null,
    tvgCountry: null,
    groupTitle: null,
  };

  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
  if (tvgIdMatch) result.tvgId = tvgIdMatch[1] || null;

  const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
  if (tvgNameMatch) result.tvgName = tvgNameMatch[1] || null;

  const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
  if (tvgLogoMatch) result.tvgLogo = tvgLogoMatch[1] || null;

  const tvgLangMatch = line.match(/tvg-language="([^"]*)"/i);
  if (tvgLangMatch) result.tvgLanguage = tvgLangMatch[1] || null;

  const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/i);
  if (tvgCountryMatch) result.tvgCountry = tvgCountryMatch[1] || null;

  const groupMatch = line.match(/group-title="([^"]*)"/i);
  if (groupMatch) result.groupTitle = groupMatch[1] || null;

  const nameMatch = line.match(/,\s*(.+)$/);
  if (nameMatch) result.name = nameMatch[1].trim();

  return result;
}

/**
 * Detect stream quality from URL or channel name.
 */
function detectQuality(url, name) {
  const combined = `${url} ${name}`.toLowerCase();
  if (combined.includes('4k') || combined.includes('2160')) return '4K';
  if (combined.includes('fhd') || combined.includes('1080')) return 'FHD';
  if (combined.includes('hd') || combined.includes('720')) return 'HD';
  if (combined.includes('sd') || combined.includes('480')) return 'SD';
  return null;
}

/**
 * Extract unique group titles from parsed channels.
 */
function extractGroups(channels) {
  const groups = new Set();
  for (const ch of channels) {
    if (ch.group_title) {
      groups.add(ch.group_title);
    }
  }
  return Array.from(groups).sort();
}

module.exports = { parseM3U, parseExtInf, detectQuality, extractGroups };
