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

  await mongoose.connect(process.env.MONGO_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
    // Removed useNewUrlParser and useUnifiedTopology as they are deprecated
  });

  return mongoose.connection;
}

module.exports = connectDB;
