const mongoose = require('mongoose');
const uri = "mongodb+srv://mailmeajaylakshmanan_db_user:XihgSI131agYLiDt@photographybillingdb.ucqpjcd.mongodb.net/?appName=PhotographyBillingDB";

const User = require('./server/models/User');

async function check() {
  await mongoose.connect(uri);
  const users = await User.find({});
  console.log("Users in DB:");
  console.log(users);
  
  // If admin is not there, let's create it forcefully
  const admin = await User.findOne({ email: 'admin@clikz.com' });
  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({ email: 'admin@clikz.com', password: hashedPassword });
    console.log('Force seeded admin user.');
  } else {
    console.log('Admin user exists.');
  }
  
  process.exit(0);
}

check().catch(console.error);
