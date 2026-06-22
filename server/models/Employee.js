const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  studioId: { type: String, required: true, default: 'default_studio' },
  isDeleted: { type: Boolean, default: false },
  name: { type: String, required: true },
  role: { type: String, required: true },
  contact: { type: String, default: '' },
  phone: { type: String, default: '' }, // Keep phone for backward compatibility
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// Sync phone/contact on save
employeeSchema.pre('save', function(next) {
  if (this.contact && !this.phone) {
    this.phone = this.contact;
  } else if (this.phone && !this.contact) {
    this.contact = this.phone;
  }
  next();
});

employeeSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

employeeSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Employee', employeeSchema);
