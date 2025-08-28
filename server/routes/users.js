const express = require('express');
const User = require('../models/User');
const Department = require('../models/Department');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    let filter = { isActive: true };
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .populate('department', 'name');

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('department', 'name');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, profilePic, departmentId } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (profilePic) updateData.profilePic = profilePic;
    if (departmentId) updateData.department = departmentId;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select('-password')
      .populate('department', 'name');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
