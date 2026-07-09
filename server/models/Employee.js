const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
