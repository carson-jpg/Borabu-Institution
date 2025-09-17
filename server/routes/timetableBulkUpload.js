const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Bulk upload timetable from CSV (Admin only)
router.post('/', auth, checkRole(['admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { departmentId, year, academicYear } = req.body;

    if (!departmentId || !year) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Department ID and year are required' });
    }

    // Check if timetable already exists
    const existingTimetable = await Timetable.findOne({
      departmentId,
      year: parseInt(year),
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    });

    if (existingTimetable) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Timetable already exists for this department and year' });
    }

    const entries = [];
    const errors = [];
    let rowNumber = 1;

    // Parse CSV file
    const stream = fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        rowNumber++;

        // Validate required fields
        const requiredFields = ['courseCode', 'teacherEmail', 'dayOfWeek', 'startTime', 'endTime', 'room', 'type', 'semester'];
        const missingFields = requiredFields.filter(field => !row[field] || row[field].trim() === '');

        if (missingFields.length > 0) {
          errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`);
          return;
        }

        // Validate dayOfWeek
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!validDays.includes(row.dayOfWeek)) {
          errors.push(`Row ${rowNumber}: Invalid day of week '${row.dayOfWeek}'. Must be one of: ${validDays.join(', ')}`);
          return;
        }

        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(row.startTime) || !timeRegex.test(row.endTime)) {
          errors.push(`Row ${rowNumber}: Invalid time format. Use HH:MM format (e.g., 09:00)`);
          return;
        }

        // Validate type
        const validTypes = ['Lecture', 'Practical', 'Tutorial', 'Lab'];
        if (!validTypes.includes(row.type)) {
          errors.push(`Row ${rowNumber}: Invalid type '${row.type}'. Must be one of: ${validTypes.join(', ')}`);
          return;
        }

        // Validate semester
        const semester = parseInt(row.semester);
        if (isNaN(semester) || semester < 1 || semester > 2) {
          errors.push(`Row ${rowNumber}: Invalid semester '${row.semester}'. Must be 1 or 2`);
          return;
        }

        entries.push({
          courseCode: row.courseCode.trim(),
          teacherEmail: row.teacherEmail.trim(),
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          room: row.room.trim(),
          type: row.type,
          semester: semester
        });
      })
      .on('end', async () => {
        try {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          if (errors.length > 0) {
            return res.status(400).json({
              message: 'Validation errors in CSV file',
              errors: errors.slice(0, 10), // Limit to first 10 errors
              totalErrors: errors.length
            });
          }

          if (entries.length === 0) {
            return res.status(400).json({ message: 'No valid entries found in CSV file' });
          }

          // Resolve course IDs and teacher IDs
          const processedEntries = [];
          const courseCodeMap = new Map();
          const teacherEmailMap = new Map();

          // Get all courses for the department
          const courses = await Course.find({ departmentId }).select('_id code name');
          courses.forEach(course => {
            courseCodeMap.set(course.code, course._id);
          });

          // Get all teachers
          const teachers = await User.find({ role: 'teacher' }).select('_id email name');
          teachers.forEach(teacher => {
            teacherEmailMap.set(teacher.email, teacher._id);
          });

          for (const entry of entries) {
            const courseId = courseCodeMap.get(entry.courseCode);
            const teacherId = teacherEmailMap.get(entry.teacherEmail);

            if (!courseId) {
              errors.push(`Course code '${entry.courseCode}' not found in department`);
              continue;
            }

            if (!teacherId) {
              errors.push(`Teacher email '${entry.teacherEmail}' not found`);
              continue;
            }

            processedEntries.push({
              courseId,
              teacherId,
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
              room: entry.room,
              type: entry.type,
              semester: entry.semester
            });
          }

          if (errors.length > 0) {
            return res.status(400).json({
              message: 'Data resolution errors',
              errors: errors.slice(0, 10),
              totalErrors: errors.length
            });
          }

          // Check for conflicts
          for (let i = 0; i < processedEntries.length; i++) {
            const entry = processedEntries[i];
            for (let j = i + 1; j < processedEntries.length; j++) {
              const otherEntry = processedEntries[j];

              if (entry.dayOfWeek === otherEntry.dayOfWeek && entry.room === otherEntry.room) {
                const start1 = entry.startTime;
                const end1 = entry.endTime;
                const start2 = otherEntry.startTime;
                const end2 = otherEntry.endTime;

                // Check for time overlap
                if ((start1 <= start2 && end1 > start2) ||
                    (start1 < end2 && end1 >= end2) ||
                    (start2 <= start1 && end2 > start1)) {
                  return res.status(400).json({
                    message: `Time conflict detected in room ${entry.room} on ${entry.dayOfWeek}`
                  });
                }
              }
            }
          }

          // Create timetable
          const timetable = new Timetable({
            departmentId,
            year: parseInt(year),
            entries: processedEntries,
            academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            createdBy: req.user.id
          });

          await timetable.save();

          const populatedTimetable = await Timetable.findById(timetable._id)
            .populate('departmentId', 'name')
            .populate('createdBy', 'name email')
            .populate('entries.courseId', 'name code level')
            .populate('entries.teacherId', 'name email');

          res.status(201).json({
            message: `Timetable created successfully with ${processedEntries.length} entries`,
            timetable: populatedTimetable
          });

        } catch (error) {
          console.error('Error processing bulk upload:', error);
          res.status(500).json({ message: 'Server error during bulk upload' });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        fs.unlinkSync(req.file.path);
        res.status(400).json({ message: 'Error parsing CSV file' });
      });

  } catch (error) {
    console.error('Bulk upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
