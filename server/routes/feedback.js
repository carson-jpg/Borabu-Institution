const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { auth } = require('../middleware/auth');

// Get feedback for teacher
router.get('/teacher', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ teacherId: req.user.id })
      .populate('studentId', 'name email')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get feedback for student
router.get('/student', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({
      studentId: req.user.id,
      isPrivate: false
    })
      .populate('teacherId', 'name email')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create feedback
router.post('/', auth, async (req, res) => {
  try {
    const feedback = new Feedback({
      ...req.body,
      teacherId: req.user.id
    });
    const savedFeedback = await feedback.save();
    const populatedFeedback = await Feedback.findById(savedFeedback._id)
      .populate('studentId', 'name email')
      .populate('courseId', 'name code')
      .populate('teacherId', 'name email');

    res.status(201).json(populatedFeedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update feedback
router.put('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name email')
      .populate('courseId', 'name code')
      .populate('teacherId', 'name email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete feedback
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndDelete({
      _id: req.params.id,
      teacherId: req.user.id
    });
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
