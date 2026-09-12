const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a memory title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide memory content'],
    },
    type: {
      type: String,
      enum: ['note', 'document', 'conversation', 'memory', 'certificate', 'project', 'achievement'],
      default: 'memory',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    tags: {
      type: [String],
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    importance: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user reference'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user item sorting and filtering
memorySchema.index({ user: 1, createdAt: -1 });

const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema);

module.exports = Memory;

