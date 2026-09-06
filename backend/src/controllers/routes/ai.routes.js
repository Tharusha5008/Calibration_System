const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');
const ctrl = require('../controllers/ai.controller');

router.use(authenticate);

router.post('/train', requireRole('admin', 'technician'), ctrl.trainModel);
router.post('/predict', ctrl.predict);              // used by 'user' on the measurement screen
router.get('/status', ctrl.modelStatus);

module.exports = router;