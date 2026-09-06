/**
 * Middleware Entry Point
 * Exports all authentication, authorization, and utility middleware
 */

const authMiddleware = require('./authMiddleware');

module.exports = {
  ...authMiddleware,
  authMiddleware
};
