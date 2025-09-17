const express = require('express');
const Assignment = require('../models/Assignment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get assignments
router.get('/', auth, async (req, res) => {
  try {
    const { courseId, teacherId, teacherEmail, type, isActive } = req.query;
    let filter = {};

    if (courseId) {
      // Handle case where courseId might be a comma-separated string
      if (courseId.includes(',')) {
        filter.courseId = { $in: courseId.split(',') };
      } else {
        filter.courseId = courseId;
      }
    }

    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // If teacher ID or email is provided, filter by teacher's assignments
    if (teacherId || teacherEmail) {
      let teacherFilter = {};

      if (teacherId) {
        teacherFilter._id = teacherId;
      } else if (teacherEmail) {
        const Teacher = require('../models/Teacher');
        const teacher = await Teacher.findOne({ email: teacherEmail });
        if (teacher) {
          teacherFilter._id = teacher._id;
        } else {
          // If no teacher found with this email, return empty array
          return res.json([]);
        }
      }

      filter.teacherId = teacherFilter._id;
    }

    const assignments = await Assignment.find(filter)
      .populate('courseId', 'name code')
      .populate('teacherId', 'firstName lastName email')
      .sort({ dueDate: 1 });

    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create assignment (Teachers and Admin)
router.post('/', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, type, courseId, dueDate, totalMarks, instructions, attachments } = req.body;

    // Find teacher by user ID
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const assignment = new Assignment({
      title,
      description,
      type,
      courseId,
      teacherId: teacher._id,
      dueDate: new Date(dueDate),
      totalMarks,
      instructions: instructions || '',
      attachments: attachments || []
    });

    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('courseId', 'name code')
      .populate('teacherId', 'firstName lastName email');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update assignment (Teachers and Admin)
router.put('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, type, courseId, dueDate, totalMarks, instructions, attachments, isActive } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if teacher owns this assignment
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || assignment.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.type = type || assignment.type;
    assignment.courseId = courseId || assignment.courseId;
    assignment.dueDate = dueDate ? new Date(dueDate) : assignment.dueDate;
    assignment.totalMarks = totalMarks || assignment.totalMarks;
    assignment.instructions = instructions !== undefined ? instructions : assignment.instructions;
    assignment.attachments = attachments || assignment.attachments;
    assignment.isActive = isActive !== undefined ? isActive : assignment.isActive;

    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('courseId', 'name code')
      .populate('teacherId', 'firstName lastName email');

    res.json(populatedAssignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete assignment (Teachers and Admin)
router.delete('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if teacher owns this assignment
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || assignment.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
