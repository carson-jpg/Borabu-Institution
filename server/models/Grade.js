const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  grade: {
    type: String,
    required: true,
    enum: ['Mastery', 'Proficiency', 'Competent', 'Not Yet Competent']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  year: {
    type: Number,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index to ensure one grade per student per course per semester
gradeSchema.index({ studentId: 1, courseId: 1, semester: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);