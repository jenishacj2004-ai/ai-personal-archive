/**
 * AI Personal Archive - Express Server
 * Week 2, Task 1: Express Route & Controller Architecture
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import Database connection
const connectDB = require('./config/db');

// Import modular route handlers
const authRoutes = require('./routes/authRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base / Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Personal Archive API is running',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth',
      memories: '/api/memories',
      users: '/api/users'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/users', userRoutes);

// 404 Not Found Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route Not Found`
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server only if executed directly
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 AI Personal Archive Server running on port ${PORT}`);
    console.log(`📍 Auth Routes:     http://localhost:${PORT}/api/auth`);
    console.log(`📍 Memory Routes:   http://localhost:${PORT}/api/memories`);
    console.log(`📍 User Routes:     http://localhost:${PORT}/api/users`);
  });
}

module.exports = { app, server };
