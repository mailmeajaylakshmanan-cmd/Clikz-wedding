const mongoose = require('mongoose');

const eventCategorySchema = new mongoose.Schema({
  studioId: { type: String, required: true, default: 'default_studio' },
  isDeleted: { type: Boolean, default: false },
  name: { type: String, required: true },
  showTerms: { type: Boolean, default: true },
  termsAndConditions: { type: String, default: '' },
}, { timestamps: true });

eventCategorySchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

eventCategorySchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('EventCategory', eventCategorySchema);
