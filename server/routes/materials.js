const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/materials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|mp4|avi|mov|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get materials for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const materials = await Material.find({
      courseId: req.params.courseId,
      $or: [
        { isPublic: true },
        { teacherId: req.user.id }
      ]
    })
      .populate('teacherId', 'name email')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get materials by teacher
router.get('/teacher', auth, async (req, res) => {
  try {
    const materials = await Material.find({ teacherId: req.user.id })
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload material
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const materialData = {
      ...req.body,
      teacherId: req.user.id,
      fileUrl: req.file ? `/uploads/materials/${req.file.filename}` : null,
      fileName: req.file ? req.file.originalname : null,
      fileSize: req.file ? req.file.size : null
    };

    const material = new Material(materialData);
    const savedMaterial = await material.save();
    const populatedMaterial = await Material.findById(savedMaterial._id)
      .populate('teacherId', 'name email')
      .populate('courseId', 'name code');

    res.status(201).json(populatedMaterial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update material
router.put('/:id', auth, async (req, res) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('teacherId', 'name email')
      .populate('courseId', 'name code');

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete material
router.delete('/:id', auth, async (req, res) => {
  try {
    const material = await Material.findOneAndDelete({
      _id: req.params.id,
      teacherId: req.user.id
    });
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Increment view/download count
router.put('/:id/:action', auth, async (req, res) => {
  try {
    const { action } = req.params;
    const updateField = action === 'view' ? 'viewCount' : 'downloadCount';

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $inc: { [updateField]: 1 } },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
