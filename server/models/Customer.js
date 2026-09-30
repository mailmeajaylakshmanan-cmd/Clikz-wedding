const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  address: { type: String, default: '' },
  totalInvoices: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  totalBalance: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
