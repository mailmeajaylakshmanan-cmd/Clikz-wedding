require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const Deliverable = require('./models/Deliverable');

const deliverablesList = [
  "1-Pendrive",
  "1-Wedding Highlights",
  "1-Wedding Reel",
  "1-Mini Album",
  "140 Pages Premium Wedding Album",
  "2-Calendar",
  "2-70 Pages Album",
  "2-Photo Frames",
  "3-Calendars",
  "4-Photo Frames",
  "5-Photo Frames",
  "60 Pages Candid Album",
  "60 Pages Album",
  "Calendar",
  "Candid Wedding Highlights",
  "Cinematic Wedding Highlights",
  "Full Function Video",
  "Full Function Video + Pendrive",
  "Full Wedding Video with Pendrive",
  "Live QR Scanner Gallery",
  "Unlimited Prints",
  "Unlimited Prints on Selfie Mirror Booth",
  "Wedding Reel"
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    for (const name of deliverablesList) {
      const exists = await Deliverable.findOne({ name });
      if (!exists) {
        await Deliverable.create({ name, description: '' });
        console.log(`Added: ${name}`);
      } else {
        console.log(`Skipped (already exists): ${name}`);
      }
    }
    
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
