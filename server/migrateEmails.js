const mongoose = require('mongoose');
require('dotenv').config();
const Customer = require('./models/Customer');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Find customers where email exists and is not empty
    const customers = await Customer.find({ email: { $ne: '' } });
    
    let updatedCount = 0;
    for (let c of customers) {
      if (c.email) {
        // Append email to address if address exists, else just set as address
        if (c.address) {
          c.address = c.address + ', ' + c.email;
        } else {
          c.address = c.email;
        }
        
        // Clear the email field
        c.email = '';
        
        await c.save();
        updatedCount++;
      }
    }
    
    console.log(`Migrated email to address for ${updatedCount} customers.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
