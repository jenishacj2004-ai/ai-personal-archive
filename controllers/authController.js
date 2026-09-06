/**
 * Authentication & User Management Controller
 * AI Personal Archive - Week 2, Task 4: User Management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Standard Email Validation Regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper to generate JWT Token
 * @param {Object} user - User document
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in .env');
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    secret,
    {
      expiresIn: '7d'
    }
  );
};

// @desc    Register a new user (Always defaults to 'user' role for security)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields with specific descriptive errors
    if (!name || (typeof name === 'string' && name.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a name'
      });
    }

    if (!email || (typeof email === 'string' && email.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // 2. Validate email format
    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // 3. Check whether the email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // 4. Hash the password using bcryptjs (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create the user - SECURITY: Public signup ALWAYS defaults to 'user' role
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user'
    });

    // 6. Generate JWT token
    const token = generateToken(user);

    // 7. Return success response (never exposing password)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    // Handle MongoDB duplicate key index error (code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required input presence
    if (!email || (typeof email === 'string' && email.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 3. Compare entered password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Generate JWT token with user id and role
    const token = generateToken(user);

    // 5. Return success response (never exposing password)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out user & clear session
// @route   POST /api/auth/logout
// @access  Public / Protected
const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/profile
// @access  Private (Protected by JWT)
const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if user is authenticated & valid
// @route   GET /api/auth/check-user
// @access  Private (Protected by JWT)
const checkUser = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if authenticated user has admin role
// @route   GET /api/auth/check-admin
// @access  Private / Admin
const checkAdmin = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      isAdmin: req.user.role === 'admin',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  getProfile,
  checkUser,
  checkAdmin
};
