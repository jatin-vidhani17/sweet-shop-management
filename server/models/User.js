// server/models/User.js
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  password: { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
