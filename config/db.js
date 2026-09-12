/**
 * MongoDB Atlas Connection Configuration
 * AI Personal Archive - Week 2, Task 2A
 */

const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If currently connecting, return the existing connection promise
  if (cachedConnection && mongoose.connection.readyState === 2) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('YOUR_MONGODB_ATLAS_CONNECTION_STRING') || mongoUri.includes('<username>')) {
    console.warn('⚠️  MongoDB Warning: MONGO_URI is not set or contains placeholder credentials.');
    console.warn('👉 Please set your actual MongoDB Atlas connection string in .env:');
    console.warn('   MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/personal_archiver?retryWrites=true&w=majority"\n');
    return null;
  }

  try {
    cachedConnection = mongoose.connect(mongoUri, {
      dbName: 'personal_archiver',
      serverSelectionTimeoutMS: 5000,
    });

    await cachedConnection;

    console.log(`✅ MongoDB Connected Successfully: ${mongoose.connection.host || 'Atlas Cluster'}`);
    console.log(`📦 Database: ${mongoose.connection.name || 'personal_archiver'}`);
    return mongoose.connection;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    cachedConnection = null;
    // Don't exit process in development if user is still entering credentials
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

module.exports = connectDB;
