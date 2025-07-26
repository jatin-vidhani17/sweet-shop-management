// server/api/hello.js (vercel serverless function)
const connectDB = require('./db');
const User = require('../models/User');

module.exports = async (req, res) => {
  await connectDB();
  // ... your logic
  res.json({ ok: true });
};
// This is a simple serverless function that connects to the database
// and can be extended to handle various API requests.