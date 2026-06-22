const mongoose = require('mongoose');
require('dotenv').config();

const Invoice = require('./models/Invoice');
const Customer = require('./models/Customer');
const EventCategory = require('./models/EventCategory');
const Service = require('./models/Service');
const Employee = require('./models/Employee');

const MONGODB_URI = process.env.MONGODB_URI;

const seedInvoices = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB...');

    const studioId = 'default_studio';

    // Get reference data
    const customer1 = await Customer.findOne({ name: 'Karthik & Priya', studioId });
    const customer2 = await Customer.findOne({ name: 'Arun & Divya', studioId });
    const weddingCat = await EventCategory.findOne({ name: 'Wedding', studioId });
    const engagementCat = await EventCategory.findOne({ name: 'Engagement', studioId });
    const photographer = await Employee.findOne({ name: 'Muthu', studioId });
    const cinematographer = await Employee.findOne({ name: 'Ramesh', studioId });

    if (!customer1 || !customer2) {
      console.log('Error: Customers not found. Run seedMasters.js first.');
      return;
    }

    // Date generation
    const today = new Date();
    
    // Future date (Booking) - 30 days from now
    const futureDateObj = new Date();
    futureDateObj.setDate(today.getDate() + 30);
    const futureDateStr = futureDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Past date (Finished Order) - 60 days ago
    const pastDateObj = new Date();
    pastDateObj.setDate(today.getDate() - 60);
    const pastDateStr = pastDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const invoices = [
      {
        studioId,
        invoiceNo: 'CWF-1001',
        date: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5), // Created 5 days ago
        customer: { name: customer1.name, phone: customer1.phone },
        event: 'Engagement Ceremony',
        eventCategory: engagementCat ? engagementCat._id : null,
        eventCategoryName: engagementCat ? engagementCat.name : 'Engagement',
        eventDate: futureDateStr,
        location: 'Leela Palace, Chennai',
        services: [
          { service: 'Traditional Photography', description: 'Full event', price: 15000, total: 15000 },
          { service: 'Candid Photography', description: '1 Senior Candid', price: 25000, total: 25000 }
        ],
        subTotal: 40000,
        discount: 0,
        total: 40000,
        advancePaid: 10000,
        advancePaymentDate: today.toISOString(),
        advancePaymentMethod: 'UPI',
        totalPaid: 0,
        status: 'partial',
        requiredStaff: 2,
        staffAllocated: photographer && cinematographer ? [
          { employeeId: photographer._id, name: photographer.name, role: photographer.role },
          { employeeId: cinematographer._id, name: cinematographer.name, role: cinematographer.role }
        ] : []
      },
      {
        studioId,
        invoiceNo: 'CWF-0990',
        date: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 70), // Created 70 days ago
        customer: { name: customer2.name, phone: customer2.phone },
        event: 'Traditional Wedding',
        eventCategory: weddingCat ? weddingCat._id : null,
        eventCategoryName: weddingCat ? weddingCat.name : 'Wedding',
        eventDate: pastDateStr,
        location: 'Codissia, Coimbatore',
        services: [
          { service: 'Cinematic Wedding Film', description: 'Full coverage', price: 40000, total: 40000 },
          { service: 'Traditional Videography', description: 'HD Video', price: 15000, total: 15000 },
          { service: 'Premium Canvera Album', description: '12x18 40 sheets', price: 20000, total: 20000 }
        ],
        subTotal: 75000,
        discount: 5000,
        total: 70000,
        advancePaid: 20000,
        advancePaymentDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 70).toISOString(),
        advancePaymentMethod: 'Bank Transfer',
        totalPaid: 50000,
        totalPaymentDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 40).toISOString(),
        totalPaymentMethod: 'Cash',
        status: 'paid',
        requiredStaff: 2,
        staffAllocated: photographer && cinematographer ? [
          { employeeId: photographer._id, name: photographer.name, role: photographer.role },
          { employeeId: cinematographer._id, name: cinematographer.name, role: cinematographer.role }
        ] : []
      }
    ];

    console.log('Seeding Sample Invoices/Orders...');
    for (const invData of invoices) {
      // Check if invoice exists to avoid duplicates
      const existing = await Invoice.findOne({ invoiceNo: invData.invoiceNo, studioId });
      if (!existing) {
        // Pre-save hook handles setting eventDates and balance/staffingStatus
        await Invoice.create(invData);
        console.log(`Created Invoice: ${invData.invoiceNo}`);
      } else {
        console.log(`Invoice ${invData.invoiceNo} already exists.`);
      }
    }

    console.log('✅ Sample Orders injected successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

seedInvoices();
