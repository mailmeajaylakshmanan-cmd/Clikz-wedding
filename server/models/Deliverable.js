const mongoose = require('mongoose');

const deliverableSchema = new mongoose.Schema({
  studioId: { type: String, required: true, default: 'default_studio' },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  name: { type: String, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

deliverableSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

deliverableSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Deliverable', deliverableSchema);
