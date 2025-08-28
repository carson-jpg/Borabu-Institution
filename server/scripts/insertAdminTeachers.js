const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Pre-defined admin and teacher accounts
const adminAccounts = [
  {
    name: 'System Administrator',
    email: 'admin@borabutti.ac.ke',
    role: 'admin',
    password: 'Admin123!', // Default password - should be changed on first login
    isPreRegistered: true,
    requiresPasswordReset: true
  }
];

const teacherAccounts = [
  {
    name: 'John Doe',
    email: 'jdoe@borabutti.ac.ke',
    role: 'teacher',
    password: 'Teacher123!',
    isPreRegistered: true,
    requiresPasswordReset: true,
    departmentName: 'Computing & Informatics'
  },
  {
    name: 'Mary Wanjiku',
    email: 'mwanjiku@borabutti.ac.ke',
    role: 'teacher',
    password: 'Teacher123!',
    isPreRegistered: true,
    requiresPasswordReset: true,
    departmentName: 'Business'
  },
  {
    name: 'Ali Yusuf',
    email: 'ayusuf@borabutti.ac.ke',
    role: 'teacher',
    password: 'Teacher123!',
    isPreRegistered: true,
    requiresPasswordReset: true,
    departmentName: 'Health Sciences'
  },
  {
    name: 'Grace Kamau',
    email: 'gkamau@borabutti.ac.ke',
    role: 'teacher',
    password: 'Teacher123!',
    isPreRegistered: true,
    requiresPasswordReset: true,
    departmentName: 'Electrical & Electronics'
  },
  {
    name: 'Peter Otieno',
    email: 'potieno@borabutti.ac.ke',
    role: 'teacher',
    password: 'Teacher123!',
    isPreRegistered: true,
    requiresPasswordReset: true,
    departmentName: 'Mechanical Engineering'
  }
];

const seedAdminTeachers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get department mapping
    const departments = await Department.find();
    const departmentMap = {};
    departments.forEach((dept) => {
      departmentMap[dept.name] = dept._id;
    });

    console.log('🚀 Starting pre-registration of admin and teacher accounts...');

    // Insert admin accounts
    for (const admin of adminAccounts) {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: admin.email });
      if (existingAdmin) {
        console.log(`ℹ️  Admin account ${admin.email} already exists, skipping...`);
        continue;
      }

      // Create admin user with plain password - User model will hash it
      const adminUser = new User({
        name: admin.name,
        email: admin.email,
        password: admin.password, // Plain password - will be hashed by User model
        role: admin.role,
        isPreRegistered: admin.isPreRegistered,
        requiresPasswordReset: admin.requiresPasswordReset,
        emailVerified: true // Pre-registered accounts should be email verified
      });

      await adminUser.save();
      console.log(`✅ Admin account created: ${admin.email}`);
    }

    // Insert teacher accounts
    for (const teacher of teacherAccounts) {
      // Check if teacher user already exists
      const existingUser = await User.findOne({ email: teacher.email });
      if (existingUser) {
        console.log(`ℹ️  Teacher user account ${teacher.email} already exists, skipping...`);
        continue;
      }

      // Create teacher user with plain password - User model will hash it
      const teacherUser = new User({
        name: teacher.name,
        email: teacher.email,
        password: teacher.password, // Plain password - will be hashed by User model
        role: teacher.role,
        isPreRegistered: teacher.isPreRegistered,
        requiresPasswordReset: teacher.requiresPasswordReset,
        emailVerified: true // Pre-registered accounts should be email verified
      });

      await teacherUser.save();
      console.log(`✅ Teacher user account created: ${teacher.email}`);

      // Check if teacher record exists and create if not
      const existingTeacher = await Teacher.findOne({ email: teacher.email });
      if (!existingTeacher && departmentMap[teacher.departmentName]) {
        const teacherRecord = new Teacher({
          name: teacher.name,
          email: teacher.email,
          departmentId: departmentMap[teacher.departmentName]
        });
        await teacherRecord.save();
        console.log(`✅ Teacher record created: ${teacher.email}`);
      }
    }

    console.log('🎉 Pre-registration completed successfully!');
    console.log('\n📋 Account Details:');
    console.log('Admin Accounts:');
    adminAccounts.forEach(admin => {
      console.log(`  Email: ${admin.email}, Password: ${admin.password}`);
    });
    console.log('\nTeacher Accounts:');
    teacherAccounts.forEach(teacher => {
      console.log(`  Email: ${teacher.email}, Password: ${teacher.password}`);
    });
    console.log('\n⚠️  IMPORTANT: Users should change their passwords on first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error pre-registering accounts:', error);
    process.exit(1);
  }
};

seedAdminTeachers();
