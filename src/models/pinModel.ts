import mongoose from 'mongoose';

const pinSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'a pin must have a title'],
      trim: true,
      maxLength: [50, 'A title cant exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, 'A description cant exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'a pin must have an author'],
    },
    imageURL: {
      type: String,
      trim: true,
      maxLength: [100, 'A url cant exceed 100 characters'],
      required: true,
    },
    comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment' }],
  },
  { timestamps: true }
);

export const Pin = mongoose.model('Pin', pinSchema);
