import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../types/express';
import { User } from './../models/userModel';
import { updateMeInput } from '../schemas/userSchema';
import AppError from '../utils/appError';
import ApiFeatures from '../utils/apiFeatures';
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // TODO: refresh token and anything with select: false still shows in user
  // because of pre find middleware that populates the user,
  //  so we need to remove the sensitive data before sending the response
  console.log('hello first');
  const user = await User.findById(req.user?.id);
  console.log('hello');

  if (!user) {
    return next(new AppError('User not found', 404));
  }
  return res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};
export const updateMe = async (
  req: AuthRequest<{}, {}, updateMeInput>,
  res: Response,
  next: NextFunction
) => {
  let { name } = req.body;
  let updateData: { name?: string; avatar?: string } = { name };
  if (req.file) {
    // dynamically create avatar if exsists
    updateData.avatar = `/uploads/users/${req.user?.id}/${req.file.filename}`;
  }
  console.log('avatar', req.file?.filename);
  const updatedUser = await User.findByIdAndUpdate(req.user?.id, updateData, {
    runValidators: true,
    returnDocument: 'after',
  });
  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }
  return res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
};
export const deleteMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findByIdAndDelete(req.user?.id);

  return res.status(204).json({
    status: 'success',
    data: { user },
  });
};
export const getFollowers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userQuery = User.findById(req.params.id).populate({
    path: 'followers',
    select: 'name avatar email',
  });
  const user = await new ApiFeatures(userQuery, req.query).paginate().query;

  res.status(200).json({
    status: 'success',
    results: user?.followers.length || 0,
    data: user?.followers || [],
  });
};
export const getFollowing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userQuery = User.findById(req.params.id).populate({
    path: 'followings',
    select: 'name avatar email',
  });
  const user = await new ApiFeatures(userQuery, req.query).paginate().query;

  res.status(200).json({
    status: 'success',
    results: user?.followings.length || 0,
    data: user?.followings || [],
  });
};

export const followUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.params.id) return next(new AppError('User id is required', 400));
  const userToFollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user?.id);

  if (!currentUser) return next(new AppError('Current user not found', 404));
  if (!userToFollow) return next(new AppError('User not found', 404));
  console.log('hello');
  await Promise.all([
    User.findByIdAndUpdate(userToFollow._id, {
      $addToSet: { followers: currentUser._id },
    }),
    User.findByIdAndUpdate(currentUser._id, {
      $addToSet: { followings: userToFollow._id },
    }),
  ]);
  res.status(200).json({
    status: 'success',
    message: `You are now following ${userToFollow.name}`,
  });
};

export const unfollowUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.id) return next(new AppError('User id is required', 400));
  const userToUnfollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user?.id);

  if (!currentUser) return next(new AppError('Current user not found', 404));
  if (!userToUnfollow) return next(new AppError('User not found', 404));
  await Promise.all([
    User.findByIdAndUpdate(userToUnfollow?._id, {
      $pull: { followers: currentUser?._id },
    }),
    User.findByIdAndUpdate(currentUser?._id, {
      $pull: { followings: userToUnfollow?._id },
    }),
  ]);
  res.status(200).json({
    status: 'success',
    message: `You have unfollowed ${userToUnfollow.name}`,
  });
};
