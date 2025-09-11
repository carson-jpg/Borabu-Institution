const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Transcript = require('../models/Transcript');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all students (Admin and Teachers)
router.get('/', auth, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { department, year } = req.query;
    let filter = { isActive: true };

    if (department) filter.departmentId = department;
    if (year) filter.year = year;

    const students = await Student.find(filter)
      .populate('userId', 'name email')
      .populate('departmentId', 'name')
      .populate('courses', 'name code');
    
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by user ID (for students to get their own data)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.params.userId })
      .populate('userId', 'name email')
      .populate('departmentId', 'name description')
      .populate('courses', 'name code level credits');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if user is authorized to view this student
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('departmentId', 'name description')
      .populate('courses', 'name code level credits');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if user is authorized to view this student
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/transcripts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Extract admission number from filename (e.g., "BTI2023_001.pdf" -> "BTI2023_001")
    const fileName = path.parse(file.originalname).name;
    // Clean filename but keep underscores (common in admission numbers)
    const admissionNo = fileName.replace(/[^a-zA-Z0-9_]/g, ''); // Keep alphanumeric and underscores
    cb(null, `${admissionNo}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload single transcript (Admin only)
router.post('/upload-transcript', auth, authorize('admin'), upload.single('transcript'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileName = path.parse(req.file.originalname).name;
    const admissionNo = fileName.replace(/[^a-zA-Z0-9]/g, ''); // Remove all non-alphanumeric characters

    // Find the student by admission number (normalize format for comparison)
    const normalizedAdmissionNo = admissionNo.toUpperCase();
    
    // First try exact match
    let student = await Student.findOne({ admissionNo: normalizedAdmissionNo });
    
    // If not found, try matching by removing all non-alphanumeric characters from both sides
    if (!student) {
      const cleanAdmissionNo = normalizedAdmissionNo.replace(/[^a-zA-Z0-9]/g, '');
      const students = await Student.find({});
      student = students.find(s => 
        s.admissionNo.replace(/[^a-zA-Z0-9]/g, '') === cleanAdmissionNo
      );
    }
    
    if (!student) {
      // Clean up the uploaded file if student not found
      fs.unlinkSync(filePath);
      return res.status(404).json({ message: `Student not found with admission number: ${admissionNo}` });
    }

    // Create a new transcript entry
    const transcript = new Transcript({
      studentId: student._id,
      filePath: filePath,
      originalName: req.file.originalname,
      admissionNo: student.admissionNo,
      uploadedBy: req.user._id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await transcript.save();

    res.status(200).json({ 
      message: 'Transcript uploaded successfully', 
      transcript 
    });
  } catch (error) {
    console.error('Error uploading transcript:', error);
    res.status(500).json({ message: 'Failed to upload transcript' });
  }
});

// Upload multiple transcripts (Batch upload - Admin only)
router.post('/upload-transcripts', auth, authorize('admin'), upload.array('transcripts', 20), async (req, res) => {
  try {
    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const filePath = file.path;
        const fileName = path.parse(file.originalname).name;
        const admissionNo = fileName.replace(/[^a-zA-Z0-9_]/g, '');

        // Validate admission number format
        if (!admissionNo || admissionNo.length < 3) {
          errors.push({
            fileName: file.originalname,
            error: 'Invalid admission number format in filename'
          });
          fs.unlinkSync(filePath);
          continue;
        }

        // Find the student by admission number (normalize format for comparison)
        const normalizedAdmissionNo = admissionNo.toUpperCase();
        
        // First try exact match
        let student = await Student.findOne({ admissionNo: normalizedAdmissionNo });
        
        // If not found, try matching by removing all non-alphanumeric characters from both sides
        if (!student) {
          const cleanAdmissionNo = normalizedAdmissionNo.replace(/[^a-zA-Z0-9]/g, '');
          const students = await Student.find({});
          student = students.find(s => 
            s.admissionNo.replace(/[^a-zA-Z0-9]/g, '') === cleanAdmissionNo
          );
        }
        
        if (!student) {
          errors.push({
            fileName: file.originalname,
            admissionNo,
            error: 'Student not found'
          });
          fs.unlinkSync(filePath);
          continue;
        }

        // Create a new transcript entry
        const transcript = new Transcript({
          studentId: student._id,
          filePath: filePath,
          originalName: file.originalname,
          admissionNo: student.admissionNo,
          uploadedBy: req.user._id,
          fileSize: file.size,
          mimeType: file.mimetype
        });

        await transcript.save();

        results.push({
          fileName: file.originalname,
          admissionNo,
          studentName: student.userId?.name,
          status: 'success',
          transcriptId: transcript._id
        });
      } catch (fileError) {
        errors.push({
          fileName: file.originalname,
          error: fileError.message
        });
        // Clean up file if there was an error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.status(200).json({
      message: 'Batch upload completed',
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error in batch transcript upload:', error);
    res.status(500).json({ message: 'Failed to process batch upload' });
  }
});

// Create student (Admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { userId, admissionNo, departmentId, year, courses } = req.body;

    const student = new Student({
      userId,
      admissionNo,
      departmentId,
      year,
      courses: courses || []
    });

    await student.save();
    
    const populatedStudent = await Student.findById(student._id)
      .populate('userId', 'name email')
      .populate('departmentId', 'name')
      .populate('courses', 'name code');
    
    res.status(201).json(populatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student (Admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { admissionNo, departmentId, year, courses } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { admissionNo, departmentId, year, courses },
      { new: true }
    ).populate('userId', 'name email')
     .populate('departmentId', 'name')
     .populate('courses', 'name code');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add fee record (Admin only)
router.post('/:id/fees', auth, authorize('admin'), async (req, res) => {
  try {
    const { amount, dueDate, description } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.fees.push({
      amount,
      dueDate,
      description,
      status: 'pending'
    });

    await student.save();
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update fee status (Admin only)
router.put('/:id/fees/:feeId', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, paidDate } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const fee = student.fees.id(req.params.feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    fee.status = status;
    if (status === 'paid' && paidDate) {
      fee.paidDate = paidDate;
    }

    await student.save();
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/courses', auth, async (req, res) => {
    try {
        const { courseId, year } = req.body;

        // Validate required fields
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        // Validate student ID format
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid student ID format' });
        }

        const student = await Student.findById(req.params.id);
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

        student.courses.push(courseId);
        await student.save();

        const populatedStudent = await Student.findById(student._id)
            .populate('userId', 'name email')
            .populate('departmentId', 'name')
            .populate('courses', 'name code level credits');

        res.status(201).json(populatedStudent);
    } catch (error) {
        console.error('Error adding course to student:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
