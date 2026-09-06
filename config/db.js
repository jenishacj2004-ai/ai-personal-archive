/**
 * MongoDB Atlas Connection Configuration
 * AI Personal Archive - Week 2, Task 2A
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('YOUR_MONGODB_ATLAS_CONNECTION_STRING') || mongoUri.includes('<username>')) {
    console.warn('⚠️  MongoDB Warning: MONGO_URI is not set or contains placeholder credentials.');
    console.warn('👉 Please set your actual MongoDB Atlas connection string in .env:');
    console.warn('   MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/personal_archiver?retryWrites=true&w=majority"\n');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'personal_archiver', // Explicitly use database 'personal_archiver'
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't exit process in development if user is still entering credentials
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

module.exports = connectDB;
