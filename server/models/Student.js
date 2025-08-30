const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  paidDate: {
    type: Date
  }
});

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admissionNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  fees: [feeRecordSchema],
  helbLoan: {
    amount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'disbursed', 'rejected'],
      default: 'pending'
    },
    applicationDate: {
      type: Date
    },
    disbursementDate: {
      type: Date
    },
    loanNumber: {
      type: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
