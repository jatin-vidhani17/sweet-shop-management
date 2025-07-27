const connectDB = require('../../db');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { name, role, email, password, confirmPassword } = req.body || JSON.parse(req.body || '{}');
  if (!name || !role || !email || !password || !confirmPassword)
    return res.status(400).json({ message: 'Please enter all fields' });
  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords don't match" });
  if (!['customer', 'admin'].includes(role))
    return res.status(400).json({ message: 'Invalid role' });

  await connectDB();
  if (await User.findOne({ email })) return res.status(400).json({ message: 'Email exists' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, role, email, password: hash });
  const payload = { user: { id: user.id, role: user.role } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  return res.status(201).json({ token });
};
