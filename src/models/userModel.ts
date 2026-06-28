import mongoose, { Document, Query } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import { string } from 'zod';

export interface IUser extends Document {
  name: string;
  email: string;
  avatar: string;
  role?: 'user' | 'admin';
  password?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordLastChangedAt?: Date;
  active: boolean;
  refreshToken: string[];
  correctPassword(candidatePassword: string, correctPassword: string): Promise<boolean>;
  changedPasswordAfterToken(JWTTimestamp: number): boolean;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
    },
    email: {
      type: String,
      required: [true, 'A user must have an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Invalid email'],
    },

    avatar: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
    },
    password: {
      type: String,
      select: false,
    },
    passwordLastChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      // select: false,
    },
    refreshToken: {
      type: [String],
      default: [],
    },
  },
  {
    methods: {
      changedPasswordAfterToken(JWTTimestamp: number): boolean {
        if (!this.passwordLastChangedAt) return false;
        const changeTimestamp = Math.floor(this.passwordLastChangedAt.getTime() / 1000);
        return changeTimestamp > JWTTimestamp;
      },

      async correctPassword(
        candidatePassword: string,
        correctPassword: string
      ): Promise<boolean> {
        return await bcrypt.compare(candidatePassword, correctPassword);
      },
    },
  }
);
userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.isNew) return;
  // Subtracting 1 second to make sure the token is always created after the password has been changed
  this.passwordLastChangedAt = new Date(Date.now() - 1000);
});

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre(/^find/, function (this: Query<any, any>) {
  // because sanitzer removes it to protect against NoSQL injection
  this.find({ active: mongoose.trusted({ $ne: false }) });
});

export const User = mongoose.model<IUser>('User', userSchema);
