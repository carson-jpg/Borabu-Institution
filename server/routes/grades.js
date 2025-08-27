const express = require('express');
const Grade = require('../models/Grade');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get grades
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, courseId, semester, year, teacherId, teacherEmail } = req.query;
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
    if (semester) filter.semester = semester;
    if (year) filter.year = year;

    // If user is a student, only show their grades
    if (req.user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        filter.studentId = student._id;
      }
    }

    // If teacher ID or email is provided, filter by teacher's courses
    if (teacherId || teacherEmail) {
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
      }
      
      const teacherCourses = await Course.find(teacherFilter);
      const courseIds = teacherCourses.map(course => course._id);
      filter.courseId = { $in: courseIds };
    }

    const grades = await Grade.find(filter)
      .populate('studentId', 'admissionNo')
      .populate('courseId', 'name code')
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    
    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update grade (Teachers and Admin)
router.post('/', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId, courseId, grade, semester, year, remarks } = req.body;

    // Check if grade already exists
    let existingGrade = await Grade.findOne({
      studentId,
      courseId,
      semester,
      year
    });

    if (existingGrade) {
      // Update existing grade
      existingGrade.grade = grade;
      existingGrade.remarks = remarks || '';
      await existingGrade.save();
      
      const populatedGrade = await Grade.findById(existingGrade._id)
        .populate('studentId', 'admissionNo')
        .populate('courseId', 'name code')
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        });
      
      res.json(populatedGrade);
    } else {
      // Create new grade
      const newGrade = new Grade({
        studentId,
        courseId,
        grade,
        semester,
        year,
        remarks: remarks || ''
      });

      await newGrade.save();
      
      const populatedGrade = await Grade.findById(newGrade._id)
        .populate('studentId', 'admissionNo')
        .populate('courseId', 'name code')
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        });
      
      res.status(201).json(populatedGrade);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete grade (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

