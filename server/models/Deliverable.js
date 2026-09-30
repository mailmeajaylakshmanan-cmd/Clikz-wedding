const mongoose = require('mongoose');

const deliverableSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true }
}, { timestamps: true });

deliverableSchema.index({ name: 1 }, {
  collation: {
    locale: 'en',
    strength: 2
  }
});

module.exports = mongoose.model('Deliverable', deliverableSchema);