const mongoose = require('mongoose');
require('dotenv').config();

const Deliverable = require('./models/Deliverable');

const MONGODB_URI = process.env.MONGODB_URI;

const items = [
  "60 pages candid album",
  "140 pages premium wedding album",
  "1-mini album",
  "4-photo frames",
  "Calendar",
  "Full wedding video with pendrive",
  "Candid wedding highlights",
  "Wedding reel",
  "Unlimited prints"
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');
    
    let addedCount = 0;
    for (const item of items) {
      // Check if it already exists to avoid duplicates
      const exists = await Deliverable.findOne({ name: { $regex: new RegExp(`^${item}$`, 'i') } });
      if (!exists) {
        await Deliverable.create({ name: item, studioId: 'default_studio' });
        addedCount++;
        console.log(`Added: ${item}`);
      }
    }
    console.log(`Seed complete. Added ${addedCount} new deliverables.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
