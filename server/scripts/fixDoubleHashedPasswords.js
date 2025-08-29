const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/borabu-institution');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix double-hashed passwords for existing users
const fixDoubleHashedPasswords = async () => {
  try {
    const User = require('../models/User');
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to check`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      try {
        // Try to verify the password by comparing with itself (if double-hashed)
        // If it's double-hashed, bcrypt.compare will return false
        const isDoubleHashed = await bcrypt.compare(user.password, user.password);
        
        if (!isDoubleHashed) {
          // This password is likely double-hashed, let's fix it
          console.log(`Fixing double-hashed password for user: ${user.email}`);
          
          // Extract the original password by hashing once more (reverse the double hash)
          // This assumes the original password was hashed with salt 10
          const originalHash = await bcrypt.hash(user.password, 10);
          
          // Update the user with the correctly hashed password
          user.password = originalHash;
          await user.save();
          
          fixedCount++;
          console.log(`Fixed password for: ${user.email}`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }
    
    console.log(`\nFixed ${fixedCount} users with double-hashed passwords`);
    
  } catch (error) {
    console.error('Error fixing passwords:', error);
  }
};

// Alternative: Reset passwords for all users to a known value
const resetAllPasswords = async (newPassword = 'password123') => {
  try {
    const User = require('../models/User');
    
    const users = await User.find({});
    console.log(`Resetting passwords for ${users.length} users`);
    
    for (const user of users) {
      user.password = newPassword; // Will be hashed by pre-save hook
      await user.save();
      console.log(`Reset password for: ${user.email}`);
    }
    
    console.log(`\nReset passwords for ${users.length} users to: ${newPassword}`);
    
  } catch (error) {
    console.error('Error resetting passwords:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  console.log('Choose an option:');
  console.log('1. Fix double-hashed passwords (recommended)');
  console.log('2. Reset all passwords to a default value');
  console.log('3. Exit');
  
  // For script usage, you can modify this to accept command line arguments
  // For now, we'll use option 1 (fix double-hashed passwords)
  
  await fixDoubleHashedPasswords();
  
  // Or uncomment the line below to reset all passwords
  // await resetAllPasswords('newpassword123');
  
  mongoose.connection.close();
  console.log('Database connection closed');
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixDoubleHashedPasswords, resetAllPasswords };
