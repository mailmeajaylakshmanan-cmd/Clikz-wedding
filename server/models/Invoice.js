const mongoose = require('mongoose');

const serviceLineSchema = new mongoose.Schema({
  service: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory' },
  categoryName: { type: String, default: '' },
});

function parseDateString(str) {
  if (!str) return null;
  const match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true },
  date: { type: Date, default: Date.now },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: '' },
  },
  event: { type: String, default: '' },
  eventCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory' }],
  eventCategoryName: { type: String, default: '' },
  showTerms: { type: Boolean, default: true },
  termsAndConditions: { type: String, default: '' },
  eventDate: { type: String, default: '' },
  eventDates: [Date],
  location: { type: String, default: '' },
  services: [serviceLineSchema],
  assignedDeliverables: [{
    name: String,
    description: String
  }],
  subTotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['UPI', 'Cash', 'Bank Transfer'], default: 'Cash' },
    type: { type: String, default: 'Advance' }
  }],
  balance: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
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
}, { timestamps: true, strict: false });

// Auto-generate invoice number and update staffing status before validation
invoiceSchema.pre('validate', async function (next) {
  if (!this.invoiceNo) {
    const lastInvoice = await mongoose.model('Invoice').findOne({ invoiceNo: /^CWF-\d+$/ }).sort({ invoiceNo: -1 }).collation({ locale: 'en_US', numericOrdering: true }).lean();
    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNo) {
      const match = lastInvoice.invoiceNo.match(/^CWF-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    this.invoiceNo = `CWF-${String(nextNumber).padStart(4, '0')}`;
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
  const totalPaidAmount = this.payments ? this.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0) : 0;
  this.balance = this.total - totalPaidAmount;

  // Auto-resolve status based on balance
  if (this.total > 0) {
    if (this.balance <= 0) {
      this.status = 'paid';
    } else if (this.balance < this.total) {
      this.status = 'partial';
    } else {
      this.status = 'pending';
    }
  }

  next();
});

invoiceSchema.index({ invoiceNo: 1 }, { unique: true });
invoiceSchema.index({ status: 1, createdAt: -1, 'customer.name': 1, invoiceNo: 1 });
invoiceSchema.index({ eventDates: 1 });
invoiceSchema.index({ 'staffAllocated.employeeId': 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
