const fs = require('fs');
const { createReadStream } = require('fs');
const sax = require('sax');
const logger = require('./logger');

/**
 * Parse an XMLTV EPG file or string into structured program data.
 * Uses SAX streaming parser for memory efficiency with large files.
 */
async function parseXMLTV(input) {
  return new Promise((resolve, reject) => {
    const channels = {};
    const programs = [];
    let currentElement = null;
    let currentChannel = null;
    let currentProgram = null;
    let textBuffer = '';

    const parser = sax.createStream(true, {
      trim: true,
      normalize: true,
      lowercase: true,
    });

    parser.on('opentag', (node) => {
      currentElement = node.name;

      if (node.name === 'channel') {
        currentChannel = {
          id: node.attributes.id || node.attributes.ID || '',
          name: '',
          icon: '',
        };
      }

      if (node.name === 'programme') {
        currentProgram = {
          channel_epg_id: node.attributes.channel || node.attributes.CHANNEL || '',
          start_time: parseXmltvDate(node.attributes.start || node.attributes.START || ''),
          end_time: parseXmltvDate(node.attributes.stop || node.attributes.STOP || ''),
          title: '',
          description: '',
          category: '',
          icon: '',
        };
      }

      if (node.name === 'icon' && node.attributes.src) {
        if (currentChannel) currentChannel.icon = node.attributes.src;
        if (currentProgram) currentProgram.icon = node.attributes.src;
      }

      textBuffer = '';
    });

    parser.on('text', (text) => {
      textBuffer += text;
    });

    parser.on('cdata', (text) => {
      textBuffer += text;
    });

    parser.on('closetag', (name) => {
      if (currentChannel) {
        if (name === 'display-name') currentChannel.name = textBuffer.trim();
        if (name === 'channel') {
          channels[currentChannel.id] = currentChannel;
          currentChannel = null;
        }
      }

      if (currentProgram) {
        if (name === 'title') currentProgram.title = textBuffer.trim();
        if (name === 'desc') currentProgram.description = textBuffer.trim();
        if (name === 'category') currentProgram.category = textBuffer.trim();
        if (name === 'programme') {
          if (currentProgram.title && currentProgram.start_time && currentProgram.end_time) {
            programs.push(currentProgram);
          }
          currentProgram = null;
        }
      }

      textBuffer = '';
      currentElement = null;
    });

    parser.on('error', (err) => {
      logger.error('XMLTV parse error:', err.message);
      parser.resume();
    });

    parser.on('end', () => {
      logger.info(`XMLTV parsed: ${Object.keys(channels).length} channels, ${programs.length} programs`);
      resolve({ channels, programs });
    });

    if (typeof input === 'string' && !input.includes('<') && fs.existsSync(input)) {
      const stream = createReadStream(input, { encoding: 'utf-8' });
      stream.pipe(parser);
      stream.on('error', reject);
    } else {
      parser.write(input);
      parser.end();
    }
  });
}

/**
 * Parse XMLTV date format (YYYYMMDDHHmmss +HHMM) to JS Date.
 */
function parseXmltvDate(dateStr) {
  if (!dateStr) return null;

  const cleaned = dateStr.trim();
  const year = parseInt(cleaned.substring(0, 4), 10);
  const month = parseInt(cleaned.substring(4, 6), 10) - 1;
  const day = parseInt(cleaned.substring(6, 8), 10);
  const hour = parseInt(cleaned.substring(8, 10), 10) || 0;
  const minute = parseInt(cleaned.substring(10, 12), 10) || 0;
  const second = parseInt(cleaned.substring(12, 14), 10) || 0;

  const tzMatch = cleaned.match(/([+-]\d{4})$/);
  if (tzMatch) {
    const tzStr = tzMatch[1];
    const tzSign = tzStr[0] === '+' ? 1 : -1;
    const tzHours = parseInt(tzStr.substring(1, 3), 10);
    const tzMinutes = parseInt(tzStr.substring(3, 5), 10);
    const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
    utcDate.setMinutes(utcDate.getMinutes() - tzSign * (tzHours * 60 + tzMinutes));
    return utcDate;
  }

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

module.exports = { parseXMLTV, parseXmltvDate };
