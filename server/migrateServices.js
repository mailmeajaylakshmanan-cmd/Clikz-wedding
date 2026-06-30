const mongoose = require('mongoose');
require('dotenv').config();

// We connect to the DB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // We can't use the model strictly if the schema changed and we are querying old schema fields
    // So we use raw collection or just disable strict mode temporarily.
    const db = mongoose.connection.db;
    const services = await db.collection('services').find({ categories: { $exists: true } }).toArray();
    
    let clonedCount = 0;
    let migratedCount = 0;

    for (const service of services) {
      if (service.categories && service.categories.length > 0) {
        // The first category goes to the main service
        const primaryCategoryId = service.categories[0];
        
        // Clone for remaining categories
        for (let i = 1; i < service.categories.length; i++) {
          const newService = { ...service };
          delete newService._id;
          delete newService.categories;
          newService.category = service.categories[i];
          await db.collection('services').insertOne(newService);
          clonedCount++;
        }

        // Update original document
        await db.collection('services').updateOne(
          { _id: service._id },
          { 
            $set: { category: primaryCategoryId },
            $unset: { categories: "" }
          }
        );
        migratedCount++;
      } else {
        // If it has no categories, we should probably just unset it or assign a dummy
        // But let's just unset categories
        await db.collection('services').updateOne(
          { _id: service._id },
          { $unset: { categories: "" } }
        );
      }
    }
    
    console.log(`Migrated ${migratedCount} services, cloned ${clonedCount} new services.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
