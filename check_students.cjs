const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Student = require('./server/models/Student');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const checkStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const students = await Student.find({}).limit(5);
    
    if (students.length === 0) {
      console.log('❌ No students found in the database');
    } else {
      console.log('📋 Found students:');
      students.forEach((student, index) => {
        console.log(`${index + 1}. ID: ${student._id}, Admission No: ${student.admissionNo}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking students:', error);
    process.exit(1);
  }
};

checkStudents();
