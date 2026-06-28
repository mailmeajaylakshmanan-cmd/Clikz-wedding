require('dotenv').config();
const mongoose = require('mongoose');

const Customer = require('./models/Customer');
const Employee = require('./models/Employee');
const EventCategory = require('./models/EventCategory');
const Invoice = require('./models/Invoice');
const InvoiceMedia = require('./models/InvoiceMedia');
const Service = require('./models/Service');

async function wipe() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    await Customer.deleteMany({});
    await Employee.deleteMany({});
    await EventCategory.deleteMany({});
    await Invoice.deleteMany({});
    await InvoiceMedia.deleteMany({});
    await Service.deleteMany({});

    console.log('All backend data (except Users) has been wiped clean.');
    process.exit(0);
  } catch (err) {
    console.error('Error wiping data:', err);
    process.exit(1);
  }
}

wipe();
