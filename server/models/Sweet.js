const mongoose = require('mongoose');

const sweetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['chocolate', 'candy', 'gummy', 'hard-candy', 'lollipop', 'dessert', 'other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  ingredients: [{
    type: String
  }],
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search functionality
sweetSchema.index({ name: 'text', category: 'text', description: 'text' });

module.exports = mongoose.models.Sweet || mongoose.model('Sweet', sweetSchema);
