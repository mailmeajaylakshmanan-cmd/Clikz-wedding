require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const allUsers = await User.collection.find({}).toArray();
  console.log('All Users raw:');
  console.log(allUsers.map(u => ({ email: u.email, studioId: u.studioId })));
  mongoose.disconnect();
});
