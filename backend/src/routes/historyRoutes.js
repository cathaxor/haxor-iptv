const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', historyController.getHistory);
router.post('/', historyController.addHistory);
router.delete('/', historyController.clearHistory);

module.exports = router;
