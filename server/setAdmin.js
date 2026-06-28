require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function setAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Remove all existing users
    await User.deleteMany({});
    console.log('Cleared existing users.');

    // Create the specified admin
    const hashedPassword = await bcrypt.hash('Aswin@321315', 10);
    const user = await User.create({ 
      email: 'ASWINHARI', 
      password: hashedPassword, 
      studioId: 'default_studio' 
    });

    console.log('Created new login:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('Error setting admin:', err);
    process.exit(1);
  }
}

setAdmin();
