const mongoose = require('mongoose');
require('dotenv').config();

const EventCategory = require('./models/EventCategory');

const MONGODB_URI = process.env.MONGODB_URI;

const renameEvents = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for renaming...');

    const renameMap = {
      'Nichayathartham (Engagement)': 'Engagement',
      'Janavasam (Mapillai Azhaippu)': 'Groom Procession',
      'Vratham & Nalangu': 'Wedding Rituals',
      'Muhurtham (Wedding)': 'Wedding',
      'Reception (Varraverpu)': 'Reception'
    };

    for (const [oldName, newName] of Object.entries(renameMap)) {
      const result = await EventCategory.findOneAndUpdate(
        { name: oldName },
        { name: newName },
        { new: true }
      );
      if (result) {
        console.log(`Renamed "${oldName}" to "${newName}"`);
      }
    }

    console.log('✅ English renaming complete!');

  } catch (error) {
    console.error('Error renaming data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

renameEvents();
