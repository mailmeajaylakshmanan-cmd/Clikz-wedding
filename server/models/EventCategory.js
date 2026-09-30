const mongoose = require('mongoose');

const eventCategorySchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  name: { type: String, required: true, trim: true },
  showTerms: { type: Boolean, default: true },
  termsAndConditions: { type: String, default: '' },
}, { timestamps: true });

eventCategorySchema.index({ name: 1 }, {
  collation: {
    locale: 'en',
    strength: 2
  }
});

module.exports = mongoose.model('EventCategory', eventCategorySchema);



