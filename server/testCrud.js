require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Customer = require('./models/Customer');
const EventCategory = require('./models/EventCategory');
const Service = require('./models/Service');
const Invoice = require('./models/Invoice');

async function testCrud() {
  let createdCustomer, createdCategory, createdService, createdInvoice;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for CRUD Test.\n');

    // ==========================================
    // 1. CREATE
    // ==========================================
    console.log('--- 1. TESTING INSERTION (CREATE) ---');
    
    createdCustomer = await Customer.create({
      name: 'Test Customer',
      phone: '9876543210'
    });
    console.log('✔ Inserted Customer:', createdCustomer.name);

    createdCategory = await EventCategory.create({
      name: 'Test Wedding Category'
    });
    console.log('✔ Inserted Event Category:', createdCategory.name);

    createdService = await Service.create({
      name: 'Test Photography Service',
      eventCategory: createdCategory._id,
      descriptions: ['Full Day Coverage', 'Candid Only']
    });
    console.log('✔ Inserted Service:', createdService.name);

    createdInvoice = await Invoice.create({
      customer: {
        _id: createdCustomer._id,
        name: createdCustomer.name,
        phone: createdCustomer.phone
      },
      eventCategory: createdCategory._id,
      eventCategoryName: createdCategory.name,
      event: 'Test Engagement',
      services: [{
        service: createdService.name,
        description: 'Full Day Coverage',
        price: 50000,
        total: 50000
      }],
      subTotal: 50000,
      total: 50000,
      balance: 50000,
      status: 'pending'
    });
    console.log('✔ Inserted Invoice:', createdInvoice.invoiceId, '\n');

    // ==========================================
    // 2. READ
    // ==========================================
    console.log('--- 2. TESTING FETCH (READ) ---');
    const fetchedInvoice = await Invoice.findById(createdInvoice._id);
    console.log('✔ Successfully fetched Invoice ID:', fetchedInvoice.invoiceId);
    console.log('  Customer Name in Invoice:', fetchedInvoice.customer.name, '\n');

    // ==========================================
    // 3. UPDATE
    // ==========================================
    console.log('--- 3. TESTING UPDATE ---');
    fetchedInvoice.status = 'partial';
    fetchedInvoice.advancePaid = 20000;
    fetchedInvoice.balance = 30000;
    const updatedInvoice = await fetchedInvoice.save();
    console.log('✔ Successfully updated Invoice Status to:', updatedInvoice.status);
    console.log('  New Balance:', updatedInvoice.balance, '\n');

    // ==========================================
    // 4. DELETE
    // ==========================================
    console.log('--- 4. TESTING DELETION (DELETE) ---');
    // Using hard delete for test cleanup
    await Customer.deleteOne({ _id: createdCustomer._id });
    await EventCategory.deleteOne({ _id: createdCategory._id });
    await Service.deleteOne({ _id: createdService._id });
    await Invoice.deleteOne({ _id: createdInvoice._id });
    
    console.log('✔ Successfully deleted test Customer, Category, Service, and Invoice from DB.\n');
    
    console.log('🎉 ALL CRUD TESTS PASSED SUCCESSFULLY! The database is clean.');

    process.exit(0);
  } catch (err) {
    console.error('❌ CRUD Test failed:', err);
    process.exit(1);
  }
}

testCrud();
