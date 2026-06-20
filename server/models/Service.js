const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  descriptions: [{ type: String }],
  eventCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory' },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
