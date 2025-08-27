const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('MONGODB_URI environment variable is not set!');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log('Connection URI:', mongoURI);

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  
  // Check if User model exists and count users
  const User = require('./server/models/User');
  const userCount = await User.countDocuments();
  console.log(`Total users in database: ${userCount}`);
  
  // Check if admin account exists
  const adminUser = await User.findOne({ email: 'admin@borabutti.ac.ke' });
  if (adminUser) {
    console.log('✅ Admin account found:', adminUser.email);
    console.log('User details:', {
      name: adminUser.name,
      role: adminUser.role,
      isActive: adminUser.isActive
    });
  } else {
    console.log('❌ Admin account not found');
  }
  
  // List all users
  const allUsers = await User.find({}, 'name email role isActive');
  console.log('\nAll users in database:');
  allUsers.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - ${user.role} - Active: ${user.isActive}`);
  });
  
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('Please check:');
  console.log('1. MongoDB connection string in .env file');
  console.log('2. MongoDB Atlas cluster status');
  console.log('3. Network connectivity');
  console.log('4. IP whitelisting in MongoDB Atlas');
  process.exit(1);
});
