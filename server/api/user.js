const connectDB = require('./db');
const User = require('../models/User');

module.exports = async (req, res) => {
  await connectDB();

  if (req.method === 'GET') {
    const users = await User.find();
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const { name, email, password } = req.body;
    try {
      const newUser = new User({ name, email, password });
      await newUser.save();
      return res.status(201).json(newUser);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
