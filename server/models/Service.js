const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  name: { type: String, required: true, trim: true },
  descriptions: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory', required: true },
}, { timestamps: true });

serviceSchema.index({ category: 1, name: 1 }, {
  collation: {
    locale: 'en',
    strength: 2
  }
});

module.exports = mongoose.model('Service', serviceSchema);


