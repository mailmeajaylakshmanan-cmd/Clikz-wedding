const mongoose = require('mongoose');

const eventCategorySchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  name: { type: String, required: true },
  showTerms: { type: Boolean, default: true },
  termsAndConditions: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('EventCategory', eventCategorySchema);
