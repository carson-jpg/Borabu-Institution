const express = require('express');
const Transcript = require('../models/Transcript');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all transcripts for a student (Student can see their own, Admin/Teacher can see all)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const transcripts = await Transcript.find({ 
      studentId, 
      isActive: true 
    }).populate('uploadedBy', 'name email');

    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transcripts by admission number
router.get('/admission/:admissionNo', auth, async (req, res) => {
  try {
    const { admissionNo } = req.params;

    // Find student by admission number
    const student = await Student.findOne({ admissionNo: admissionNo.toUpperCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const transcripts = await Transcript.find({ 
      admissionNo: admissionNo.toUpperCase(), 
      isActive: true 
    }).populate('uploadedBy', 'name email');

    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching transcripts by admission number:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// View transcript (inline display)
router.get('/view/:transcriptId', auth, async (req, res) => {
  try {
    const { transcriptId } = req.params;

    const transcript = await Transcript.findById(transcriptId)
      .populate('studentId', 'userId admissionNo')
      .populate('uploadedBy', 'name email');

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    // Check authorization
    const student = await Student.findById(transcript.studentId);
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file data exists in database
    if (!transcript.fileData || transcript.fileData.length === 0) {
      return res.status(404).json({ message: 'Transcript file data not found in database' });
    }

    // Set appropriate headers for inline display
    res.setHeader('Content-Type', transcript.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', transcript.fileSize);

    // Send the file data from database
    res.send(transcript.fileData);

  } catch (error) {
    console.error('Error viewing transcript:', error);
    res.status(500).json({ message: 'Failed to view transcript' });
  }
});

// Download transcript
router.get('/download/:transcriptId', auth, async (req, res) => {
  try {
    const { transcriptId } = req.params;

    const transcript = await Transcript.findById(transcriptId)
      .populate('studentId', 'userId admissionNo')
      .populate('uploadedBy', 'name email');

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    // Check authorization
    const student = await Student.findById(transcript.studentId);
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file data exists in database
    if (!transcript.fileData || transcript.fileData.length === 0) {
      return res.status(404).json({ message: 'Transcript file data not found in database' });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', transcript.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${transcript.originalName}"`);
    res.setHeader('Content-Length', transcript.fileSize);

    // Send the file data from database
    res.send(transcript.fileData);

  } catch (error) {
    console.error('Error downloading transcript:', error);
    res.status(500).json({ message: 'Failed to download transcript' });
  }
});

// Get transcript by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id)
      .populate('studentId', 'userId admissionNo name')
      .populate('uploadedBy', 'name email');

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    // Check authorization
    const student = await Student.findById(transcript.studentId);
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transcript (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    // Delete the file from filesystem
    if (fs.existsSync(transcript.filePath)) {
      fs.unlinkSync(transcript.filePath);
    }

    await Transcript.findByIdAndDelete(req.params.id);

    res.json({ message: 'Transcript deleted successfully' });
  } catch (error) {
    console.error('Error deleting transcript:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
