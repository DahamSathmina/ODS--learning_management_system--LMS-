const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendEmailVerification);
router.post('/refresh-token', authenticate, authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateMe);
router.post('/check-email', authController.checkEmail);

module.exports = router;