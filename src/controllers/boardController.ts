import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types/express';
import { Board } from '../models/boardModel';
import { Pin } from '../models/pinModel';
import AppError from '../utils/appError';
import ApiFeatures from '../utils/apiFeatures';
import { createBoardInput, updateBoardInput } from '../schemas/boardSchema';

export const getMyBoards = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const query = Board.find({ createdBy: req.user?.id as any });

  const result = await new ApiFeatures(query, req.query).paginate().query;
  if (!result) return next(new AppError('No boards found', 404));

  res.status(200).json({
    status: 'success',
    data: result,
  });
};

export const createBoard = async (
  req: AuthRequest<{}, {}, createBoardInput>,
  res: Response,
  next: NextFunction
) => {
  const board = await Board.create({ ...req.body, createdBy: req.user?.id as any });
  if (!board) return next(new AppError('Board creation failed', 500));
  res.status(201).json({
    status: 'success',
    data: board,
  });
};

export const getBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // TODO: make it premission based for secret boards
  // as of now every board is secret from other users
  const board = await Board.findById(req.params.id).populate({
    path: 'pins',
    select: 'title description imageURL createdBy',
    populate: { path: 'createdBy', select: 'name avatar' },
  });

  if (!board) return next(new AppError('Board not found', 404));

  res.status(200).json({
    status: 'success',
    data: board,
  });
};

export const updateBoard = async (
  req: AuthRequest<any, any, updateBoardInput, any>,
  res: Response,
  next: NextFunction
) => {
  const boardCheck = await Board.findById(req.params.id);

  if (!boardCheck) return next(new AppError('Board not Found', 404));
  if (boardCheck.createdBy.toString() !== req.user?.id) {
    return next(new AppError('You are not the owner of this board', 403));
  }

  const board = await Board.findByIdAndUpdate(req.params.id as any, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: board,
  });
};

export const deleteBoard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const boardCheck = await Board.findById(req.params.id as any);
  if (!boardCheck) return next(new AppError('Board not found', 404));
  if (boardCheck.createdBy.toString() !== req.user?.id) {
    return next(new AppError('You are not the owner of this board', 403));
  }
  await Board.findByIdAndDelete(req.params.id as any);
  res.status(204).json({
    status: 'success',
    data: null,
  });
};

export const addPinToBoard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.id || !req.params.pinId) {
    return next(new AppError('Board and Pin ID is required', 400));
  }
  const board = await Board.findByIdAndUpdate(
    req.params.id as any,
    { $addToSet: { pins: req.params.pinId } },
    { returnDocument: 'after' }
  );
  if (!board) return next(new AppError('Board not found', 404));
  res.status(200).json({
    status: 'success',
    data: board,
  });
};

export const removePinFromBoard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.id || !req.params.pinId) {
    return next(new AppError('Board and Pin ID is required', 400));
  }
  const board = await Board.findByIdAndUpdate(
    req.params.id as any,
    { $pull: { pins: req.params.pinId } },
    { returnDocument: 'after' }
  );
  if (!board) return next(new AppError('Board not found', 404));
  res.status(200).json({
    status: 'success',
    data: board,
  });
};
