import mongoose, { Schema } from 'mongoose';
import { Comment } from './commentModel';

export interface IPin extends mongoose.Document {
  title: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  imageURL: string;
  comments: mongoose.Types.ObjectId[];
  likedBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  createComment(userId: mongoose.Types.ObjectId, text: string): Promise<void>;
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

    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment', default: [] }],
  },
  {
    timestamps: true,
    methods: {
      createComment: async function createComment(
        this: IPin,
        userId: string,
        text: string
      ) {
        try {
          const comment = await Comment.create({
            text,
            madeBy: userId as any,
          });
          this.comments.push(comment._id);
          await this.save();
          return comment;
        } catch (error) {
          console.error('Error creating comment:', error);
          throw error;
        }
      },
    },
  }
);

export const Pin = mongoose.model<IPin>('Pin', pinSchema);
