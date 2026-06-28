import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../types/express';
import AppError from '../utils/appError';
import { Role } from '../config/roles';

export const restrictTo =
  (...roles: Role[]) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    if (roles.includes(req.user.role as Role)) {
      return next();
    }
    return next(new AppError('forbidden to access', 403));
  };
