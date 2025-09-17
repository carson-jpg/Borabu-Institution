const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    type: { type: String, enum: ['academic', 'behavioral', 'general'], default: 'academic' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 }, // Optional rating
    isPositive: { type: Boolean, default: true },
    isPrivate: { type: Boolean, default: false }, // Private feedback not visible to student
    attachments: [{ type: String }], // URLs to attachments
    status: { type: String, enum: ['draft', 'sent', 'read'], default: 'draft' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
