const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const testAuth = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@clikz.com';
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      console.log(`❌ User ${email} not found! The pre('findOne') hook might be hiding them if isDeleted is missing.`);
    } else {
      console.log(`✅ User ${email} found successfully!`);
      console.log(`User data:`, { email: user.email, isDeleted: user.isDeleted, studioId: user.studioId });
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testAuth();
