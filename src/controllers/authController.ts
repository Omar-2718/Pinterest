import { NextFunction, Request, Response } from 'express';
import { SignupInput, LoginInput } from './../schemas/userSchema';

import { IUser, User } from '../models/userModel';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError';
import { AuthRequest } from '../types/express';

const signAccessToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    }
  );
};

const signRefreshToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
    }
  );
};

const createTokenAndSendResponse = async (
  user: IUser,
  statusCode: number,
  res: Response
) => {
  const refreshToken = signRefreshToken(user);
  const accessToken = signAccessToken(user);

  // save refresh token
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  // save cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) * 1000,
  });

  // remove sensitive data
  // user.password = undefined;
  // user.refreshTokens = [];

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    data: user,
  });
};

export const signup = async (
  req: Request<{}, {}, SignupInput>,
  res: Response,
  next: NextFunction
) => {
  const { avatar, email, name, password } = req.body;
  const newUser = await User.create({ avatar, email, name, password });
  newUser.refreshTokens = [];
  await createTokenAndSendResponse(newUser, 201, res);
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !user.password || !(await user.correctPassword(password, user.password))) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid email or password',
    });
    return;
  }
  // TODO: remove user logging in production
  await createTokenAndSendResponse(user, 200, res);
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = '';
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new AppError('Unauthorized', 401));
  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as jwt.JwtPayload;
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    return next(new AppError('Token invalid or expired', 403));
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  const currentRefreshToken = req.cookies.refreshToken;
  if (!currentRefreshToken) {
    return next(new AppError('No refresh token found', 401));
  }
  try {
    const decoded = jwt.verify(
      currentRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as jwt.JwtPayload;

    const user = await User.findOne({
      _id: decoded.id,
      refreshTokens: currentRefreshToken,
    }).select('+refreshTokens');

    if (!user) {
      return next(new AppError('Session revoked or user no longer exsists', 403));
    }
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== currentRefreshToken
    );

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) * 1000,
    });

    res.status(200).json({
      status: 'success',
      accessToken: newAccessToken,
    });
  } catch (err) {
    return next(new AppError('Refresh token expired or invalid', 403));
  }
};
