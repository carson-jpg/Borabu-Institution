const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    messageType: { type: String, enum: ['direct', 'announcement', 'feedback'], default: 'direct' },
    attachments: [{ type: String }], // URLs to attachments
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' } // For replies
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
