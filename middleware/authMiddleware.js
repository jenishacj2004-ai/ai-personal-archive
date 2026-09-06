/**
 * Authentication & Role-Based Authorization Middleware
 * AI Personal Archive - Week 2, Task 5: Middleware Development
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware: Protect routes - Verifies JWT from Authorization Bearer header
 * - Reads JWT from request header
 * - Supports Authorization: Bearer <token> format
 * - Verifies JWT using JWT_SECRET from .env
 * - Rejects missing, invalid, or expired tokens
 * - Attaches sanitized user document to req.user
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header for Bearer token (case-insensitive scheme)
  if (
    req.headers.authorization &&
    req.headers.authorization.toLowerCase().startsWith('bearer ')
  ) {
    token = req.headers.authorization.substring(7).trim();
  }

  // 2. Reject requests with no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing'
    });
  }

  // 3. Ensure JWT_SECRET is configured from environment variables
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('⚠️  JWT_SECRET is not configured in .env');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: JWT secret not configured'
    });
  }

  try {
    // 4. Verify JWT signature & expiration
    const decoded = jwt.verify(token, jwtSecret);

    // 5. Look up user by decoded token ID (excluding sensitive password hash)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    // 6. Attach authenticated user payload to request object
    req.user = user;
    next();
  } catch (error) {
    // Distinguish expired token from malformed / invalid signature token
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token has expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token'
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Restricts access to specified roles (e.g., 'user', 'admin')
 * - Rejects unauthenticated requests with 401
 * - Rejects non-authorized roles with 403 Forbidden
 *
 * @param  {...string} roles - Permitted roles (e.g. 'admin', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Verify user is attached by protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user authentication required'
      });
    }

    // Verify user role is among permitted roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${roles.join('/')} role`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  admin: authorize('admin'),
  user: authorize('user', 'admin')
};

