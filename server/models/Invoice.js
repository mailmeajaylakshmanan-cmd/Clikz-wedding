const mongoose = require('mongoose');

const serviceLineSchema = new mongoose.Schema({
  service: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

function parseDateString(str) {
  if (!str) return null;
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

const invoiceSchema = new mongoose.Schema({
  studioId: { type: String, required: true, default: 'default_studio' },
  isDeleted: { type: Boolean, default: false },
  invoiceNo: { type: String, required: true },
  date: { type: Date, default: Date.now },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  event: { type: String, default: '' },
  eventCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory' },
  eventCategoryName: { type: String, default: '' },
  showTerms: { type: Boolean, default: true },
  termsAndConditions: { type: String, default: '' },
  eventDate: { type: String, default: '' },
  eventDates: [Date],
  location: { type: String, default: '' },
  services: [serviceLineSchema],
  subTotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  advancePaymentDate: { type: String, default: '' },
  advancePaymentMethod: { type: String, default: 'Cash' },
  totalPaid: { type: Number, default: 0 },
  totalPaymentDate: { type: String, default: '' },
  totalPaymentMethod: { type: String, default: 'Cash' },
  balance: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'sent', 'partial', 'paid'],
    default: 'draft',
  },
  notes: { type: String, default: 'Grateful to be part of your celebration.' },
  requiredStaff: { type: Number, default: 0 },
  staffingStatus: {
    type: String,
    enum: ['Staffing Pending', 'Partially Staffed', 'Fully Staffed'],
    default: 'Staffing Pending',
  },
  staffAllocated: [{
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    name: String,
    role: String,
  }],
}, { timestamps: true });

// Auto-generate invoice number and update staffing status before saving
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNo) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNo = `CWF-${String(count + 1).padStart(4, '0')}`;
  }

  // Parse eventDate string to eventDates array if eventDates is empty
  if (this.eventDate && (!this.eventDates || this.eventDates.length === 0)) {
    const dates = this.eventDate
      .split(/&|,/)
      .map(d => parseDateString(d.trim()))
      .filter(d => d !== null);
    this.eventDates = dates;
  }
  
  if (this.requiredStaff === 0) {
    this.staffingStatus = 'Fully Staffed';
  } else if (!this.staffAllocated || this.staffAllocated.length === 0) {
    this.staffingStatus = 'Staffing Pending';
  } else if (this.staffAllocated.length < this.requiredStaff) {
    this.staffingStatus = 'Partially Staffed';
  } else {
    this.staffingStatus = 'Fully Staffed';
  }
  
  // Calculate and update balance
  this.balance = this.total - (this.advancePaid || 0) - (this.totalPaid || 0);

  // Auto-resolve status based on balance
  if (this.total > 0) {
    if (this.balance <= 0) {
      this.status = 'paid';
    } else if (this.status === 'paid') {
      this.status = 'partial';
    } else if ((this.advancePaid > 0 || this.totalPaid > 0) && this.status === 'draft') {
      this.status = 'partial';
    }
  }

  next();
});

invoiceSchema.index({ studioId: 1, invoiceNo: 1 }, { unique: true });
invoiceSchema.index({ status: 1, createdAt: -1, 'customer.name': 1, invoiceNo: 1 });
invoiceSchema.index({ studioId: 1, eventDates: 1 });
invoiceSchema.index({ 'staffAllocated.employeeId': 1 });

invoiceSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

invoiceSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Invoice', invoiceSchema);
