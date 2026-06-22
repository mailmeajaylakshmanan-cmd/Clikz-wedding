const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Customer = require('./models/Customer');
const Employee = require('./models/Employee');
const EventCategory = require('./models/EventCategory');
const Service = require('./models/Service');
const Invoice = require('./models/Invoice');

const MONGODB_URI = process.env.MONGODB_URI;

const fixAdminAndLegacyData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB...');

    // 1. Fix User accounts missing studioId
    const users = await User.updateMany(
      { studioId: { $exists: false } },
      { $set: { studioId: 'default_studio' } }
    );
    console.log(`✅ Fixed ${users.modifiedCount} Users missing studioId.`);

    // 2. Fix Customers missing studioId
    const customers = await Customer.updateMany(
      { studioId: { $exists: false } },
      { $set: { studioId: 'default_studio' } }
    );
    console.log(`✅ Fixed ${customers.modifiedCount} Customers missing studioId.`);

    // 3. Fix Employees missing studioId
    const employees = await Employee.updateMany(
      { studioId: { $exists: false } },
      { $set: { studioId: 'default_studio' } }
    );
    console.log(`✅ Fixed ${employees.modifiedCount} Employees missing studioId.`);

    // 4. Fix Invoices missing studioId
    const invoices = await Invoice.updateMany(
      { studioId: { $exists: false } },
      { $set: { studioId: 'default_studio' } }
    );
    console.log(`✅ Fixed ${invoices.modifiedCount} Invoices missing studioId.`);

    console.log('All legacy data successfully patched with default_studio!');

  } catch (error) {
    console.error('Error fixing data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

fixAdminAndLegacyData();
