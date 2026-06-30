const express = require('express');
const router = express.Router();
const epgController = require('../controllers/epgController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/programs', authenticate, epgController.getEpgPrograms);
router.get('/sources', authenticate, authorize('admin'), epgController.getEpgSources);
router.post('/import', authenticate, authorize('admin'), epgController.importEpg);
router.post('/sources/:id/refresh', authenticate, authorize('admin'), epgController.refreshEpg);
router.delete('/sources/:id', authenticate, authorize('admin'), epgController.deleteEpgSource);

module.exports = router;
