const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'jdoe@borabutti.ac.ke';
    const password = 'Teacher123!';
    
    // Find the user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('🔍 User details:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Password hash: ${user.password}`);
    console.log(`- Email verified: ${user.emailVerified}`);
    console.log(`- Is active: ${user.isActive}`);

    // Test password comparison
    console.log('\n🔍 Testing password comparison:');
    console.log(`- Input password: ${password}`);
    
    const isMatch = await user.comparePassword(password);
    console.log(`- Password match: ${isMatch}`);

    // Test direct bcrypt comparison
    console.log('\n🔍 Testing direct bcrypt comparison:');
    const directMatch = await bcrypt.compare(password, user.password);
    console.log(`- Direct bcrypt match: ${directMatch}`);

    // Test with different variations
    console.log('\n🔍 Testing with different variations:');
    const variations = [
      password,
      password.trim(),
      password.toLowerCase(),
      'Teacher123',
      'teacher123!'
    ];

    for (const variant of variations) {
      const match = await bcrypt.compare(variant, user.password);
      console.log(`- "${variant}": ${match}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

debugPassword();
