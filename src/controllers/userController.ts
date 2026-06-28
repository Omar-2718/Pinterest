import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../types/express';
import { User } from './../models/userModel';
import { updateMeInput } from '../schemas/userSchema';
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // TODO: refresh token and anything with select: false still shows in user
  // because of pre find middleware that populates the user,
  //  so we need to remove the sensitive data before sending the response
  const user = await User.findById(req.user?.id);
  if (!user) {
    return next(new Error('User not found'));
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
    updateData.avatar = req.file.filename;
  }
  console.log('avatar', req.file?.filename);
  const updatedUser = await User.findByIdAndUpdate(req.user?.id, updateData, {
    runValidators: true,
    returnDocument: 'after',
  });
  if (!updatedUser) {
    return next(new Error('User not found'));
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
  const page = parseInt(req.query.page as string) || 1;
  let limit = parseInt(req.query.limit as string) || 10;
  if (limit > 100) limit = 100;
  // 10 10 10
  // 0  10 20
  let skip = (page - 1) * limit;
  const user = await User.findById(req.user?.id).populate({
    path: 'followers',
    select: 'name avatar email',
    options: {
      limit: limit,
      skip: skip,
    },
  });

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
  const page = parseInt(req.query.page as string) || 1;
  let limit = parseInt(req.query.limit as string) || 10;
  if (limit > 100) limit = 100;
  let skip = (page - 1) * limit;

  const user = await User.findById(req.user?.id).populate({
    path: 'followings',
    select: 'name avatar email',
    options: {
      limit: limit,
      skip: skip,
    },
  });
  res.status(200).json({
    status: 'success',
    results: user?.followings.length || 0,
    data: user?.followings || [],
  });
};

export const followUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.params.id) return next(new Error('User id is required'));
  const userToFollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user?.id);

  if (!currentUser) return next(new Error('Current user not found'));
  if (!userToFollow) return next(new Error('User not found'));

  await Promise.all([
    User.findByIdAndUpdate(userToFollow._id, {
      $addToSet: { followers: currentUser._id },
    }),
    User.findByIdAndUpdate(currentUser._id, {
      $addToSet: { followings: userToFollow._id },
    }),
  ]);
};

export const unfollowUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.id) return next(new Error('User id is required'));
  const userToUnfollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user?.id);

  if (!currentUser) return next(new Error('Current user not found'));
  if (!userToUnfollow) return next(new Error('User not found'));
  await Promise.all([
    User.findByIdAndUpdate(userToUnfollow?._id, {
      $pull: { followers: currentUser?._id },
    }),
    User.findByIdAndUpdate(currentUser?._id, {
      $pull: { followings: userToUnfollow?._id },
    }),
  ]);
};
