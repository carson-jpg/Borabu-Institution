const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🚀 Resetting passwords for pre-registered accounts...');

    // Reset admin password
    const admin = await User.findOne({ email: 'admin@borabutti.ac.ke' });
    if (admin) {
      admin.password = 'Admin123!'; // Set plain password - User model will hash it
      await admin.save();
      console.log('✅ Admin password reset successfully');
    } else {
      console.log('❌ Admin account not found');
    }

    // Reset teacher passwords
    const teacherEmails = [
      'jdoe@borabutti.ac.ke',
      'mwanjiku@borabutti.ac.ke',
      'ayusuf@borabutti.ac.ke',
      'gkamau@borabutti.ac.ke',
      'potieno@borabutti.ac.ke'
    ];

    for (const email of teacherEmails) {
      const teacher = await User.findOne({ email });
      if (teacher) {
        teacher.password = 'Teacher123!'; // Set plain password - User model will hash it
        await teacher.save();
        console.log(`✅ Teacher password reset for: ${email}`);
      } else {
        console.log(`❌ Teacher account not found: ${email}`);
      }
    }

    console.log('🎉 Password reset completed successfully!');
    console.log('\n📋 Account Details:');
    console.log('Admin: admin@borabutti.ac.ke / Admin123!');
    console.log('Teachers: [email] / Teacher123!');
    console.log('\n⚠️  IMPORTANT: Users should change their passwords on first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
    process.exit(1);
  }
};

resetPasswords();
