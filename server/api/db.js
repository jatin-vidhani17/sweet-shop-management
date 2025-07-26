// server/api/db.js
const mongoose = require('mongoose');

let isConnected = false; // Track connection status (for serverless)

async function connectDB() {
  if (isConnected) {
    // Use existing connection on serverless platforms
    return mongoose.connection;
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }
  // Set strictQuery to suppress strict mode warnings (optional)
  mongoose.set('strictQuery', false);

  // Make the connection reusable (important for Vercel)
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false,    // Disable mongoose buffering
    serverSelectionTimeoutMS: 10000, // Optional: Increase timeouts for cold starts
  });

  isConnected = true;
  return mongoose.connection;
}

module.exports = connectDB;
