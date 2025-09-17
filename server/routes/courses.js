const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { department, level, teacher, teacherEmail } = req.query;
    let filter = { isActive: true };

    if (department) filter.departmentId = department;
    if (level) filter.level = level;
    
    // If teacher ID is provided, use it directly
    if (teacher) {
      filter.teacherId = teacher;
    }
    // If teacher email is provided, find the teacher by email first
    else if (teacherEmail) {
      const Teacher = require('../models/Teacher');
      const teacherRecord = await Teacher.findOne({ email: teacherEmail });
      if (teacherRecord) {
        filter.teacherId = teacherRecord._id;
      } else {
        // If no teacher found with this email, return empty array
        return res.json([]);
      }
    }

    const courses = await Course.find(filter)
      .populate('departmentId', 'name')
      .populate('teacherId', 'name email');
    
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('departmentId', 'name description')
      .populate('teacherId', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create course (Admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, code, level, departmentId, teacherId, credits, description } = req.body;

    const course = new Course({
      name,
      code,
      level,
      departmentId,
      teacherId,
      credits,
      description
    });

    await course.save();
    
    const populatedCourse = await Course.findById(course._id)
      .populate('departmentId', 'name')
      .populate({
        path: 'teacherId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    
    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course (Admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, code, level, departmentId, teacherId, credits, description } = req.body;

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, code, level, departmentId, teacherId, credits, description },
      { new: true }
    ).populate('departmentId', 'name')
     .populate({
        path: 'teacherId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register student for course
router.post('/:courseId/register', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId, year } = req.body;

    // Validate required fields
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Validate course ID format
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    // Validate student ID format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if the course is already enrolled
    if (student.courses.includes(courseId)) {
      return res.status(400).json({ message: 'Course already enrolled' });
    }

    // Update year if provided
    if (year && year >= 1 && year <= 4) {
      student.year = year;
    }

    // Add course to student's courses
    student.courses.push(courseId);
    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('userId', 'name email')
      .populate('departmentId', 'name')
      .populate('courses', 'name code level credits');

    res.status(201).json({
      message: 'Course registered successfully',
      student: populatedStudent
    });
  } catch (error) {
    console.error('Error registering course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
