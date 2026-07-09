const mongoose = require('mongoose');

const deliverableSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  name: { type: String, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Deliverable', deliverableSchema);
