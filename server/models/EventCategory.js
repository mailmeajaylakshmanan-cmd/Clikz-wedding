const mongoose = require('mongoose');

const eventCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  showTerms: { type: Boolean, default: true },
  termsAndConditions: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('EventCategory', eventCategorySchema);
