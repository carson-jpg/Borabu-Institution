const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['notes', 'slides', 'video', 'document', 'link'], required: true },
    fileUrl: { type: String }, // For uploaded files
    externalUrl: { type: String }, // For external links
    fileName: { type: String },
    fileSize: { type: Number }, // In bytes
    isPublic: { type: Boolean, default: true },
    tags: [{ type: String }],
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', MaterialSchema);
