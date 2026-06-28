const mongoose = require('mongoose');
require('dotenv').config();

const ServiceSchema = new mongoose.Schema({
  eventCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory' },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventCategory' }]
}, { strict: false });

const Service = mongoose.model('MigrationService', ServiceSchema, 'services');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const services = await Service.find({});
    console.log(`Found ${services.length} services to migrate.`);

    let migrated = 0;
    for (const service of services) {
      if (service.eventCategory && (!service.categories || service.categories.length === 0)) {
        service.categories = [service.eventCategory];
        service.eventCategory = undefined; // Unset old field
        await service.save();
        migrated++;
      }
    }

    console.log(`Successfully migrated ${migrated} services.`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

migrate();
