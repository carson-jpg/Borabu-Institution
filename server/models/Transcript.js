const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  admissionNo: {
    type: String,
    required: true,
    uppercase: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
transcriptSchema.index({ studentId: 1 });
transcriptSchema.index({ admissionNo: 1 });
transcriptSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Transcript', transcriptSchema);
