// server/api/db.js
const mongoose = require('mongoose');

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  mongoose.set('strictQuery', false);

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10, // Optimize for serverless
      minPoolSize: 2,  // Maintain a small pool
      socketTimeoutMS: 45000, // Prevent hanging in serverless
    });
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }

  return mongoose.connection;
}

module.exports = connectDB;