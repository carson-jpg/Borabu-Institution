const mongoose = require('mongoose');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
require('dotenv').config();

const assignTeachersToCourses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');

    // Get all courses
    const courses = await Course.find({ isActive: true });
    console.log(`Found ${courses.length} courses`);

    // Get all teachers
    const teachers = await Teacher.find();
    console.log(`Found ${teachers.length} teachers`);

    let updatedCount = 0;

    // Assign teachers to courses based on department
    for (const course of courses) {
      if (!course.teacherId) {
        // Find a teacher in the same department
        const teacherInSameDepartment = teachers.find(teacher => 
          teacher.departmentId.toString() === course.departmentId.toString()
        );

        if (teacherInSameDepartment) {
          course.teacherId = teacherInSameDepartment._id;
          await course.save();
          updatedCount++;
          console.log(`Assigned teacher ${teacherInSameDepartment.name} to course ${course.name}`);
        } else {
          console.log(`No teacher found for department in course: ${course.name}`);
        }
      }
    }

    console.log(`\nUpdated ${updatedCount} courses with teachers`);
    
    // Verify the assignments
    const updatedCourses = await Course.find({ isActive: true }).populate('teacherId', 'name email');
    console.log('\nUpdated courses:');
    updatedCourses.forEach(course => {
      console.log(`${course.name}: ${course.teacherId ? course.teacherId.name : 'No teacher'}`);
    });

  } catch (error) {
    console.error('Error assigning teachers to courses:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

assignTeachersToCourses();
