const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/public', settingsController.getPublicSettings);
router.get('/', authenticate, authorize('admin'), settingsController.getSettings);
router.put('/', authenticate, authorize('admin'), settingsController.updateSettings);

module.exports = router;
