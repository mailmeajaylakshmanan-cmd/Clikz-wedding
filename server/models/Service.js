const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  name: { type: String, required: true },
  descriptions: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
