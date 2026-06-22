const mongoose = require('mongoose');

const invoiceMediaSchema = new mongoose.Schema({
  studioId: { type: String, required: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  imageIds: [{ type: String, required: true }] // Cloudinary public_ids
}, { timestamps: true });

// Prevent global accidental leaks
invoiceMediaSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

invoiceMediaSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('InvoiceMedia', invoiceMediaSchema);
