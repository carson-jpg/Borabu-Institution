import mongoose from 'mongoose';
import User from './server/models/User.js';
import Teacher from './server/models/Teacher.js';
import Student from './server/models/Student.js';
import Course from './server/models/Course.js';
import dotenv from 'dotenv';

dotenv.config();

const enrollStudentInTeacherCourses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/borabu-institution');
    console.log('Connected to MongoDB');

    // Find a student (let's take the first one or by name)
    const studentUser = await User.findOne({ role: 'student' });
    if (!studentUser) {
      console.log('No student user found');
      return;
    }

    const student = await Student.findOne({ userId: studentUser._id }).populate('departmentId');
    if (!student) {
      console.log('No student record found');
      return;
    }

    console.log('Student:', studentUser.name, '- Department:', student.departmentId?.name);

    // Find a teacher in the same department
    const teacher = await Teacher.findOne({ departmentId: student.departmentId._id }).populate('userId');
    if (!teacher) {
      console.log('No teacher found in the same department');
      return;
    }

    console.log('Teacher:', teacher.userId?.name, '- Department:', student.departmentId?.name);

    // Find courses taught by this teacher
    const teacherCourses = await Course.find({
      teacherId: teacher._id,
      departmentId: student.departmentId._id,
      isActive: true
    });

    console.log('Teacher courses:', teacherCourses.map(c => c.name));

    // Enroll student in these courses
    const courseIds = teacherCourses.map(c => c._id);
    student.courses = courseIds;
    await student.save();

    console.log('Student enrolled in courses:', teacherCourses.map(c => c.name));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

enrollStudentInTeacherCourses();
