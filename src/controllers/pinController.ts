import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types/express';
import { Pin } from '../models/pinModel';
import ApiFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';
import { CreatePinInput, UpdatePinInput } from '../schemas/pinSchema';
import { User } from '../models/userModel';
export const getAllPins = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const pins = await new ApiFeatures(
    Pin.find({}).populate({ path: 'comments', select: 'text createdAt likedBy' }),
    req.query
  ).query;
  res.status(200).json({
    status: 'success',
    data: pins,
  });
};

export const getPin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const pin = await Pin.findById(req.params.id)
    .populate({
      path: 'createdBy',
      select: 'name avatar email',
    })
    .populate({
      path: 'comments',
      select: 'text createdAt madeBy',
      populate: { path: 'madeBy', select: 'name avatar' },
    });
  if (!pin) {
    return next(new AppError('Pin not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: pin,
  });
};

export const createPin = async (
  req: AuthRequest<{}, {}, CreatePinInput>,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    next(new AppError('Image file is required', 400));
  }
  const imageURL = `/uploads/pins/${req.user?.id}/${req.file?.filename}`;
  const pin = await Pin.create({ ...req.body, imageURL, createdBy: req.user?.id });
  res.status(201).json({
    status: 'success',
    data: pin,
  });
};

export const updatePin = async (
  req: AuthRequest<{ id: string }, {}, UpdatePinInput>,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.id) return next(new AppError('Pin ID is required', 400));
  const madeBy = (await Pin.findById(req.params.id))?.createdBy;

  if (!madeBy || madeBy.toString() !== req.user?.id) {
    return next(new AppError('You are not the owner of this pin', 403));
  }

  const pin = await Pin.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: pin,
  });
};

export const deletePin = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.id) return next(new AppError('Pin ID is required', 400));
  const madeBy = (await Pin.findById(req.params.id))?.createdBy;

  if (!madeBy || madeBy.toString() !== req.user?.id) {
    return next(new AppError('You are not the owner of this pin', 403));
  }

  const pin = await Pin.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: 'success',
    data: pin,
  });
};

export const likePin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.params.id) return next(new AppError('Pin ID is required', 400));
  if (!(await Pin.findById(req.params.id))) {
    return next(new AppError('Pin not found', 404));
  }
  const pin = await Pin.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { likedBy: req.user?.id } },
    { new: true }
  );
  // TODO: remove data from response to avoid sending large data back to the client
  res.status(200).json({
    status: 'success',
    data: pin,
  });
};

export const unlikePin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.params.id) return next(new AppError('Pin ID is required', 400));
  if (!(await Pin.findById(req.params.id))) {
    return next(new AppError('Pin not found', 404));
  }
  const pin = await Pin.findByIdAndUpdate(
    req.params.id,
    { $pull: { likedBy: req.user?.id } },
    { new: true }
  );
  // TODO: remove data from response to avoid sending large data back to the client
  res.status(200).json({
    status: 'success',
    data: pin,
  });
};

export const savePin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.params.id) return next(new AppError('Pin ID is required', 400));
  if (!(await Pin.findById(req.params.id))) {
    return next(new AppError('Pin not found', 404));
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    { $addToSet: { savedPins: req.params.id } },
    { new: true }
  );
  res.status(200).json({
    status: 'success',
    data: user,
  });
};

export const unsavePin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.params.id) return next(new AppError('Pin ID is required', 400));
  if (!(await Pin.findById(req.params.id))) {
    return next(new AppError('Pin not found', 404));
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    { $pull: { savedPins: req.params.id } },
    { new: true }
  );
  res.status(200).json({
    status: 'success',
    data: user,
  });
};

export const searchPins = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    return next(new AppError('Query is required', 400));
  }
  const pins = await Pin.find({
    $text: { $search: query },
  });
  res.status(200).json({
    status: 'success',
    data: pins,
  });
};

export const getPinLikes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const pin = await Pin.findById(req.params.id);
  if (!pin) {
    return next(new AppError('Pin not found', 404));
  }
  const query = Pin.findById(req.params.id).populate('likedBy', 'name avatar');
  const result = await new ApiFeatures(query, req.query).paginate().query;
  res.status(200).json({
    status: 'success',
    data: result.likedBy,
  });
};

export const getSavedPins = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userTest = await User.findById(req.user?.id);
  if (!userTest) {
    return next(new AppError('User not found', 404));
  }
  const user = await User.findById(req.user?.id).populate({
    path: 'savedPins',
    select: 'title description imageURL createdBy',
    populate: { path: 'createdBy', select: 'name avatar' },
  });
  res.status(200).json({
    status: 'success',
    data: user?.savedPins,
  });
};
export const getPinComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // TODO: make it one step
  const pin = await Pin.findById(req.params.id);
  if (!pin) {
    return next(new AppError('Pin not found', 404));
  }
  // TODO: make it more efficent for likedBy
  const query = Pin.findById(req.params.id).populate({
    path: 'comments',
    select: 'text createdAt madeBy likedBy',
    populate: { path: 'madeBy', select: 'name avatar' },
  });
  const result = await new ApiFeatures(query, req.query).paginate().query;
  res.status(200).json({
    status: 'success',
    data: result.comments,
  });
};

export const addCommentToPin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const pin = await Pin.findById(req.params.id);
  if (!pin) {
    return next(new AppError('Pin not found', 404));
  }
  const comment = await pin.createComment(req.user?.id as any, req.body.text);
  res.status(201).json({
    status: 'success',
    data: comment,
  });
};
