const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a memory title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide memory content'],
    },
    type: {
      type: String,
      enum: ['note', 'document', 'conversation', 'memory'],
      default: 'memory',
    },
    tags: {
      type: [String],
      default: [],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user reference'],
    },
  },
  {
    timestamps: true,
  }
);

const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema);

module.exports = Memory;
