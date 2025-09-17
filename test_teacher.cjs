const mongoose = require('mongoose');
const User = require('./server/models/User');
const Teacher = require('./server/models/Teacher');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/borabu-institution');

    const teacherUser = await User.findOne({ role: 'teacher' });
    console.log('Teacher user found:', teacherUser ? { id: teacherUser._id, email: teacherUser.email, role: teacherUser.role } : 'No teacher user found');

    if (teacherUser) {
      const teacher = await Teacher.findOne({ userId: teacherUser._id });
      console.log('Teacher record found:', teacher ? { id: teacher._id, firstName: teacher.firstName, lastName: teacher.lastName } : 'No teacher record found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
