import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types/express';

export const getMyBoards = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {};

export const createBoard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {};

export const getBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {};

export const updateBoard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {};

export const deleteBoard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {};

export const addPinToBoard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {};

export const removePinFromBoard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {};
