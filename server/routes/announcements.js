const express = require('express');
const Announcement = require('../models/Announcement');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get announcements
router.get('/', auth, async (req, res) => {
  try {
    const { audience, priority } = req.query;
    let filter = { isActive: true };

    // Filter by user role
    if (req.user.role !== 'admin') {
      filter.targetAudience = { $in: [req.user.role] };
    }

    if (audience) filter.targetAudience = { $in: [audience] };
    if (priority) filter.priority = priority;

    const announcements = await Announcement.find(filter)
      .populate('postedBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get announcement by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('postedBy', 'name email role');
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is authorized to view this announcement
    if (req.user.role !== 'admin' && !announcement.targetAudience.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create announcement (Teachers and Admin)
router.post('/', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, content, targetAudience, priority } = req.body;

    const announcement = new Announcement({
      title,
      content,
      postedBy: req.user._id,
      targetAudience,
      priority: priority || 'medium'
    });

    await announcement.save();
    
    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('postedBy', 'name email role');
    
    res.status(201).json(populatedAnnouncement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update announcement (Admin or original poster)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, targetAudience, priority } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is authorized to update
    if (req.user.role !== 'admin' && announcement.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    announcement.title = title;
    announcement.content = content;
    announcement.targetAudience = targetAudience;
    announcement.priority = priority || announcement.priority;

    await announcement.save();
    
    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('postedBy', 'name email role');
    
    res.json(populatedAnnouncement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete announcement (Admin or original poster)
router.delete('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is authorized to delete
    if (req.user.role !== 'admin' && announcement.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    announcement.isActive = false;
    await announcement.save();

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;