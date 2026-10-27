const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware, refreshAuthMiddleware } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/refresh', refreshAuthMiddleware, authController.refresh);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
