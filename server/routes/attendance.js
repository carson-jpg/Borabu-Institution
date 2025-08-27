const express = require('express');
const Attendance = require('../models/Attendance');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get attendance records
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, courseId, date, status } = req.query;
    let filter = {};

    if (studentId) filter.studentId = studentId;
    if (courseId) {
      // Handle case where courseId might be a comma-separated string
      if (courseId.includes(',')) {
        filter.courseId = { $in: courseId.split(',') };
      } else {
        filter.courseId = courseId;
      }
    }
    if (date) filter.date = new Date(date);
    if (status) filter.status = status;

    // If user is a student, only show their attendance
    if (req.user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        filter.studentId = student._id;
      }
    }

    const attendance = await Attendance.find(filter)
      .populate('studentId', 'admissionNo')
      .populate('courseId', 'name code')
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record attendance (Teachers and Admin)
router.post('/', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId, courseId, date, status, remarks } = req.body;

    // Check if attendance already exists for this date
    let existingAttendance = await Attendance.findOne({
      studentId,
      courseId,
      date: new Date(date)
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.remarks = remarks || '';
      await existingAttendance.save();
      
      const populatedAttendance = await Attendance.findById(existingAttendance._id)
        .populate('studentId', 'admissionNo')
        .populate('courseId', 'name code')
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        });
      
      res.json(populatedAttendance);
    } else {
      // Create new attendance record
      const attendance = new Attendance({
        studentId,
        courseId,
        date: new Date(date),
        status,
        remarks: remarks || ''
      });

      await attendance.save();
      
      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('studentId', 'admissionNo')
        .populate('courseId', 'name code')
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        });
      
      res.status(201).json(populatedAttendance);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk record attendance (Teachers and Admin)
router.post('/bulk', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { courseId, date, attendanceRecords } = req.body;
    const results = [];

    for (const record of attendanceRecords) {
      const { studentId, status, remarks } = record;

      // Check if attendance already exists
      let existingAttendance = await Attendance.findOne({
        studentId,
        courseId,
        date: new Date(date)
      });

      if (existingAttendance) {
        existingAttendance.status = status;
        existingAttendance.remarks = remarks || '';
        await existingAttendance.save();
        results.push(existingAttendance);
      } else {
        const attendance = new Attendance({
          studentId,
          courseId,
          date: new Date(date),
          status,
          remarks: remarks || ''
        });
        await attendance.save();
        results.push(attendance);
      }
    }

    res.json({ message: 'Attendance recorded successfully', count: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming classes for a teacher
router.get('/upcoming', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { teacherId, teacherEmail } = req.query;
    
    // Find teacher's courses
    const Course = require('../models/Course');
    let teacherFilter = {};
    
    if (teacherId) {
      teacherFilter.teacherId = teacherId;
    } else if (teacherEmail) {
      const Teacher = require('../models/Teacher');
      const teacher = await Teacher.findOne({ email: teacherEmail });
      if (teacher) {
        teacherFilter.teacherId = teacher._id;
      } else {
        // If no teacher found with this email, return empty array
        return res.json([]);
      }
    } else {
      return res.status(400).json({ message: 'Teacher ID or email is required' });
    }
    
    const teacherCourses = await Course.find(teacherFilter);
    
    // For demo purposes, return mock data for upcoming classes
    // In a real application, you would query a schedule database
    const upcomingClasses = teacherCourses.map((course, index) => ({
      _id: course._id,
      course: course.name,
      room: `Room ${index + 101}`,
      time: `${8 + index}:00 AM`,
      students: Math.floor(Math.random() * 30) + 10
    }));
    
    res.json(upcomingClasses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
