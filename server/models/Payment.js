const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  feeId: {
    type: mongoose.Schema.Types.String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KES'
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'bank', 'cash'],
    default: 'mpesa'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  mpesaReceiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  mpesaTransactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  phoneNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
paymentSchema.index({ studentId: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ mpesaReceiptNumber: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
