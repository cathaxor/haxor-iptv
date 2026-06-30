const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, channelController.getChannels);
router.get('/search', authenticate, channelController.searchChannels);
router.get('/:id', authenticate, channelController.getChannel);
router.put('/:id', authenticate, authorize('admin'), channelController.updateChannel);
router.delete('/:id', authenticate, authorize('admin'), channelController.deleteChannel);

module.exports = router;
