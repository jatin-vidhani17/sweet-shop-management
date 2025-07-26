// server/api/auth/register.js
const connectDB = require('../../api/db');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    // Parse from Next.js or Vercel body (may differ, tweak if using native Node)
    const { name, role, email, password, confirmPassword } = req.body || JSON.parse(req.body);

    if (!name || !role || !email || !password || !confirmPassword)
      return res.status(400).json({ message: 'Please enter all fields' });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords don't match" });

    await connectDB(); // Make DB connection per function call

    let user = await User.findOne({ email });
    if (user)
      return res.status(400).json({ message: 'User with that email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({ name, role, email, password: hashedPassword });

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};