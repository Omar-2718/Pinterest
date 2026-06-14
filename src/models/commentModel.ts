import mongoose from 'mongoose';
import { maxLength } from 'zod';

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    trim: true,
    maxLength: [500, 'A comment cant exceed 500 characters'],
    required: [true, 'a comment must have text'],
  },
  madeBy: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'a comment must have an author'],
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  likedBy: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
});

export const Comment = mongoose.model('Comment', commentSchema);
