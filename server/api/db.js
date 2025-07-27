const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      console.log('MongoDB already connected');
      return;
    }

    // For testing, we'll use a local MongoDB or MongoDB Atlas
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sweetshop';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
