import mongoose, { Schema } from 'mongoose';

export interface IPin extends mongoose.Document {
  title: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  imageURL: string;
  comments?: mongoose.Types.ObjectId[];
  likedBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'a pin must have an author'],
    },
    imageURL: {
      type: String,
      trim: true,
      maxLength: [100, 'A url cant exceed 100 characters'],
      required: true,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment' }],
  },
  { timestamps: true }
);

export const Pin = mongoose.model<IPin>('Pin', pinSchema);
