const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  phone: { type: String, default: '', trim: true },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' }
}, { timestamps: true });

employeeSchema.index({ name: 1 }, {
  collation: {
    locale: 'en',
    strength: 2
  }
});

module.exports = mongoose.model('Employee', employeeSchema);

