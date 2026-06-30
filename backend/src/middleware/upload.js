const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const playlistDir = path.join(uploadDir, 'playlists');
const logoDir = path.join(uploadDir, 'logos');
const epgDir = path.join(uploadDir, 'epg');

[playlistDir, logoDir, epgDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const playlistStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, playlistDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.m3u';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(allowedTypes) {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype) || allowedTypes.includes('*')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  };
}

const uploadPlaylist = multer({
  storage: playlistStorage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: fileFilter([
    'audio/x-mpegurl',
    'audio/mpegurl',
    'application/x-mpegURL',
    'application/vnd.apple.mpegurl',
    'text/plain',
    'application/octet-stream',
    '*',
  ]),
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ]),
});

module.exports = { uploadPlaylist, uploadLogo, playlistDir, logoDir, epgDir };
