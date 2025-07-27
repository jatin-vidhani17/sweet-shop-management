const mongoose = require('mongoose');
const connectDB = require('../api/db');
const User = require('../models/User');
const registerHandler = require('../api/auth/register');

// Hardcoded environment variables
const MONGO_URI = 'mongodb+srv://jatin-vidhani17:sweet1703@sweet-data.80xrilj.mongodb.net/?retryWrites=true&w=majority&appName=sweet-data';
const JWT_SECRET = '087b3d4974a40c8df7a93e23f3779d98';

async function registerUser() {
  // Mock request and response objects
  const req = {
    method: 'POST',
    body: {
      name: 'Demo User',
      email: `demo${Date.now()}@example.com`, // Unique email to avoid duplicates
      role: 'customer',
      password: 'password123',
      confirmPassword: 'password123',
    },
  };

  let statusCode = null;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatus() {
      return statusCode;
    },
    getData() {
      return responseData;
    },
  };

  try {
    // Set JWT_SECRET for register.js
    process.env.JWT_SECRET = JWT_SECRET;

    // Connect to MongoDB Atlas
    await connectDB(MONGO_URI);
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    console.log('Target collection:', User.collection.collectionName);

    // Clear existing users for clean testing
    await User.deleteMany({});
    console.log('Cleared test.users collection');

    // Call register handler
    console.log('Calling register handler with body:', req.body);
    await registerHandler(req, res);

    // Log response
    console.log('Response status:', res.getStatus());
    console.log('Response data:', res.getData());

    // Verify user in database
    const user = await User.findOne({ email: req.body.email }).lean();
    if (user) {
      console.log('User found in database:', {
        name: user.name,
        email: user.email,
        role: user.role,
        password: user.password.substring(0, 10) + '...', // Truncate for brevity
      });
    } else {
      console.log('No user found in database with email:', req.body.email);
    }

    // Log all users for debugging
    const allUsers = await User.find({}).lean();
    console.log('All users in test.users:', allUsers.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
    })));
  } catch (err) {
    console.error('Error registering user:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  }
}

registerUser();