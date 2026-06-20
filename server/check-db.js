const mongoose = require('mongoose');
const uri = "mongodb+srv://mailmeajaylakshmanan_db_user:XihgSI131agYLiDt@photographybillingdb.ucqpjcd.mongodb.net/clikz-billing?retryWrites=true&w=majority";

const User = require('./models/User');

async function check() {
  await mongoose.connect(uri);
  const users = await User.find({});
  console.log("Users in clikz-billing DB:", users.length);
  
  if (users.length > 0) {
    console.log("Emails found:");
    users.forEach(u => console.log("- " + u.email));
  }
  
  // Seed admin forcefully
  const admin = await User.findOne({ email: 'admin@clikz.com' });
  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({ email: 'admin@clikz.com', password: hashedPassword });
    console.log('Force seeded admin user into clikz-billing!');
  } else {
    console.log('Admin user already exists in clikz-billing.');
    
    // Just to be sure the password is admin123, we can overwrite it
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    admin.password = hashedPassword;
    await admin.save();
    console.log('Reset admin password to admin123 just in case.');
  }
  
  process.exit(0);
}

check().catch(console.error);
