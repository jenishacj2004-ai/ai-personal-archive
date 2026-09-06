const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getProfile,
  checkUser,
  checkAdmin
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Authentication Endpoints (Accessible without authentication)
router.post('/signup', signup);
router.post('/login', login);

// Protected Endpoints (Require valid JWT Bearer token)
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.get('/check-user', protect, checkUser);

// Admin-Only Protected Endpoint (Requires valid JWT + admin role)
router.get('/check-admin', protect, authorize('admin'), checkAdmin);

module.exports = router;

