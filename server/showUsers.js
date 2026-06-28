require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function showUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}, '-password').lean(); // Excluding the password hash for safety, or I can show it
    const usersWithPasswordHash = await User.find({}).lean();
    console.log('--- ADMIN LOGIN DATABASE ENTRIES ---');
    console.log(JSON.stringify(usersWithPasswordHash, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching users:', err);
    process.exit(1);
  }
}

showUsers();
