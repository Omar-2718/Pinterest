import mongoose from 'mongoose';
import { Document } from 'mongoose';

export interface IComment extends Document {
  text: string;
  madeBy: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  likedBy: mongoose.Schema.Types.ObjectId[];
}

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
    default: Date.now,
    // Date.now() return the timestamp created now
    // but date.now is called when the document is created
    // required: [true, 'a comment must have a creation date'],
  },
  likedBy: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
});

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
