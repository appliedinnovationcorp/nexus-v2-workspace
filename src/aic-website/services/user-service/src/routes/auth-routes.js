const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/auth-controller');

const { authenticateUser } = require('../middleware/authentication');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticateUser, logout);

module.exports = router;
