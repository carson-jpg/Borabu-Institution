const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Timetable = require('../models/Timetable');
const Department = require('../models/Department');
const Course = require('../models/Course');
const User = require('../models/User');

// Load .env from parent directory (server/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

const insertSampleTimetables = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get sample data
    const departments = await Department.find().limit(2);
    const courses = await Course.find().limit(5);
    const teachers = await User.find({ role: 'teacher' }).limit(3);

    if (departments.length === 0 || courses.length === 0 || teachers.length === 0) {
      console.log('Not enough data to create timetables. Please ensure departments, courses, and teachers exist first.');
      return;
    }

    // Sample timetable entries
    const sampleEntries = [
      {
        courseId: courses[0]._id,
        teacherId: teachers[0]._id,
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
        room: 'Lab 101',
        type: 'Lecture',
        semester: 1
      },
      {
        courseId: courses[1]._id,
        teacherId: teachers[1]._id,
        dayOfWeek: 'Monday',
        startTime: '14:00',
        endTime: '16:00',
        room: 'Lab 102',
        type: 'Practical',
        semester: 1
      },
      {
        courseId: courses[2]._id,
        teacherId: teachers[0]._id,
        dayOfWeek: 'Tuesday',
        startTime: '10:00',
        endTime: '12:00',
        room: 'Classroom 201',
        type: 'Tutorial',
        semester: 1
      },
      {
        courseId: courses[3]._id,
        teacherId: teachers[2]._id,
        dayOfWeek: 'Wednesday',
        startTime: '13:00',
        endTime: '15:00',
        room: 'Lab 103',
        type: 'Lecture',
        semester: 2
      },
      {
        courseId: courses[4]._id,
        teacherId: teachers[1]._id,
        dayOfWeek: 'Thursday',
        startTime: '09:00',
        endTime: '11:00',
        room: 'Lab 201',
        type: 'Practical',
        semester: 2
      }
    ];

    // Create timetables for different departments and years
    const timetables = [
      {
        departmentId: departments[0]._id,
        year: 1,
        entries: sampleEntries.slice(0, 3),
        academicYear: '2024-2025',
        isActive: true,
        createdBy: teachers[0]._id
      },
      {
        departmentId: departments[0]._id,
        year: 2,
        entries: sampleEntries.slice(3, 5),
        academicYear: '2024-2025',
        isActive: true,
        createdBy: teachers[0]._id
      }
    ];

    // Insert timetables
    for (const timetableData of timetables) {
      const existingTimetable = await Timetable.findOne({
        departmentId: timetableData.departmentId,
        year: timetableData.year,
        academicYear: timetableData.academicYear
      });

      if (!existingTimetable) {
        const timetable = new Timetable(timetableData);
        await timetable.save();
        console.log(`Created timetable for ${departments[0].name} - Year ${timetableData.year}`);
      } else {
        console.log(`Timetable already exists for ${departments[0].name} - Year ${timetableData.year}`);
      }
    }

    console.log('Sample timetables inserted successfully!');

  } catch (error) {
    console.error('Error inserting sample timetables:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
insertSampleTimetables();
