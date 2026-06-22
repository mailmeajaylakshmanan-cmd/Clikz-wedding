const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  studioId: { type: String, required: true, default: 'default_studio' },
  isDeleted: { type: Boolean, default: false },
  name: { type: String, required: true },
  descriptions: [{ type: String }],
  eventCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory' },
}, { timestamps: true });

serviceSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

serviceSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Service', serviceSchema);
