const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPlaylist } = require('../middleware/upload');

router.use(authenticate, authorize('admin'));

router.get('/', playlistController.getPlaylists);
router.get('/:id', playlistController.getPlaylist);
router.post('/upload', uploadPlaylist.single('file'), playlistController.uploadPlaylist);
router.post('/import-url', playlistController.importPlaylistUrl);
router.post('/:id/refresh', playlistController.refreshPlaylist);
router.delete('/:id', playlistController.deletePlaylist);

module.exports = router;
