const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.routes');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/', requireAuth, messageController.getMessages);
router.post('/', requireAuth, messageController.postMessage);

module.exports = router;