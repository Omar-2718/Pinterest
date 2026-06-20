import mongoose, { Document, Query } from 'mongoose';

export interface IBoard extends Document {
  name: string;
  description?: string;
  secret?: boolean;
  createdBy: mongoose.Schema.Types.ObjectId;
  pins: mongoose.Schema.Types.ObjectId[];
}

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'a board must have a name'],
      trim: true,
      maxLength: [50, 'a board name must not exceed 50 characters'],
    },
    description: {
      type: String,
      maxLength: [500, 'a board description must not exceed 500 characters'],
      trim: true,
    },
    secret: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'a board must have an author'],
    },
    pins: [{ type: mongoose.Schema.ObjectId, ref: 'Pin' }],
  },
  { timestamps: true }
);

boardSchema.pre(/^find/, function (this: Query<any, IBoard>) {
  this.populate('createdBy', 'name avatar');
});

export const Board = mongoose.model<IBoard>('Board', boardSchema);
