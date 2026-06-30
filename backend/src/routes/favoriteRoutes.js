const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.addFavorite);
router.get('/:channelId/check', favoriteController.checkFavorite);
router.delete('/:channelId', favoriteController.removeFavorite);

module.exports = router;
