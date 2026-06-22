const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  studioId: { type: String, required: true, default: 'default_studio' },
  isDeleted: { type: Boolean, default: false },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  totalInvoices: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  totalBalance: { type: Number, default: 0 },
}, { timestamps: true });

customerSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

customerSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Customer', customerSchema);
