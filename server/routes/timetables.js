const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const User = require('../models/User');
const Department = require('../models/Department');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// Get all timetables (Admin only)
router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate('departmentId', 'name')
      .populate('createdBy', 'name email')
      .populate('entries.courseId', 'name code level')
      .populate('entries.teacherId', 'name email')
      .sort({ createdAt: -1 });

    res.json(timetables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by department and year
router.get('/:departmentId/:year', auth, async (req, res) => {
  try {
    const { departmentId, year } = req.params;

    const timetable = await Timetable.findOne({
      departmentId,
      year: parseInt(year),
      isActive: true
    })
    .populate('departmentId', 'name')
    .populate('createdBy', 'name email')
    .populate('entries.courseId', 'name code level credits')
    .populate('entries.teacherId', 'name email');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json(timetable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's timetable (based on student's department and year)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    // First get student details
    const Student = require('../models/Student');
    const student = await Student.findById(studentId)
      .populate('departmentId')
      .populate('courses');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get timetable for student's department and year
    const timetable = await Timetable.findOne({
      departmentId: student.departmentId._id,
      year: student.year,
      isActive: true
    })
    .populate('departmentId', 'name')
    .populate('entries.courseId', 'name code level credits')
    .populate('entries.teacherId', 'name email');

    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found for this student' });
    }

    // Filter entries to only include courses the student is enrolled in
    const enrolledCourseIds = student.courses.map(course => course._id.toString());
    const filteredEntries = timetable.entries.filter(entry =>
      enrolledCourseIds.includes(entry.courseId._id.toString())
    );

    const studentTimetable = {
      ...timetable.toObject(),
      entries: filteredEntries
    };

    res.json(studentTimetable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new timetable (Admin only)
router.post('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const { departmentId, year, entries, academicYear } = req.body;

    // Validate required fields
    if (!departmentId || !year || !entries || entries.length === 0) {
      return res.status(400).json({ message: 'Department ID, year, and entries are required' });
    }

    // Check if timetable already exists for this department and year
    const existingTimetable = await Timetable.findOne({
      departmentId,
      year,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    });

    if (existingTimetable) {
      return res.status(400).json({ message: 'Timetable already exists for this department and year' });
    }

    // Validate entries
    for (const entry of entries) {
      if (!entry.courseId || !entry.teacherId || !entry.dayOfWeek || !entry.startTime || !entry.endTime || !entry.room || !entry.type) {
        return res.status(400).json({ message: 'All entry fields are required' });
      }

      // Check for time conflicts
      const conflict = entries.find(otherEntry =>
        otherEntry !== entry &&
        otherEntry.dayOfWeek === entry.dayOfWeek &&
        otherEntry.room === entry.room &&
        ((otherEntry.startTime <= entry.startTime && otherEntry.endTime > entry.startTime) ||
         (otherEntry.startTime < entry.endTime && otherEntry.endTime >= entry.endTime) ||
         (entry.startTime <= otherEntry.startTime && entry.endTime > otherEntry.startTime))
      );

      if (conflict) {
        return res.status(400).json({ message: `Time conflict detected in room ${entry.room} on ${entry.dayOfWeek}` });
      }
    }

    const timetable = new Timetable({
      departmentId,
      year,
      entries,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      createdBy: req.user.id
    });

    await timetable.save();

    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate('departmentId', 'name')
      .populate('createdBy', 'name email')
      .populate('entries.courseId', 'name code level')
      .populate('entries.teacherId', 'name email');

    res.status(201).json(populatedTimetable);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Timetable already exists for this department and year' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update timetable (Admin only)
router.put('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const { entries, isActive } = req.body;

    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    if (entries) {
      // Validate entries and check for conflicts
      for (const entry of entries) {
        if (!entry.courseId || !entry.teacherId || !entry.dayOfWeek || !entry.startTime || !entry.endTime || !entry.room || !entry.type) {
          return res.status(400).json({ message: 'All entry fields are required' });
        }

        const conflict = entries.find(otherEntry =>
          otherEntry !== entry &&
          otherEntry.dayOfWeek === entry.dayOfWeek &&
          otherEntry.room === entry.room &&
          ((otherEntry.startTime <= entry.startTime && otherEntry.endTime > entry.startTime) ||
           (otherEntry.startTime < entry.endTime && otherEntry.endTime >= entry.endTime) ||
           (entry.startTime <= otherEntry.startTime && entry.endTime > otherEntry.startTime))
        );

        if (conflict) {
          return res.status(400).json({ message: `Time conflict detected in room ${entry.room} on ${entry.dayOfWeek}` });
        }
      }

      timetable.entries = entries;
    }

    if (isActive !== undefined) {
      timetable.isActive = isActive;
    }

    await timetable.save();

    const updatedTimetable = await Timetable.findById(timetable._id)
      .populate('departmentId', 'name')
      .populate('createdBy', 'name email')
      .populate('entries.courseId', 'name code level')
      .populate('entries.teacherId', 'name email');

    res.json(updatedTimetable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete timetable (Admin only)
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
