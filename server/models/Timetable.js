const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  room: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Lecture', 'Practical', 'Tutorial', 'Lab'],
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  academicYear: {
    type: String,
    required: true,
    default: function() {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }
  }
});

const timetableSchema = new mongoose.Schema({
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  entries: [timetableEntrySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique timetable per department, year, and academic year
timetableSchema.index({ departmentId: 1, year: 1, academicYear: 1 }, { unique: true });

// Index for efficient queries
timetableSchema.index({ departmentId: 1, year: 1 });
timetableSchema.index({ 'entries.courseId': 1 });
timetableSchema.index({ 'entries.teacherId': 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
