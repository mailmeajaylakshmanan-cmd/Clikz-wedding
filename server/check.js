require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');
const Service = require('./models/Service');
const EventCategory = require('./models/EventCategory');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  for (const model of [Employee, Customer, Invoice, Service, EventCategory]) {
    const total = await model.countDocuments();
    const missing = await model.countDocuments({studioId: {$exists: false}});
    const defaultStudio = await model.countDocuments({studioId: 'default_studio'});
    console.log(`${model.modelName}: Total=${total}, Missing studioId=${missing}, default_studio=${defaultStudio}`);
    
    // Fix them just in case
    if (missing > 0 || (total > 0 && defaultStudio === 0)) {
        await model.updateMany({ studioId: { $exists: false } }, { $set: { studioId: 'default_studio' } });
        console.log(`Updated ${model.modelName} to default_studio`);
    }
  }
  mongoose.disconnect();
});
