import { NextFunction, Request, Response } from 'express';
import AppError from './../utils/appError';

const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: any, res: Response) => {
  // Operational error, we trust to reveal to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // programming or other unknown errors, we dont want to leak to the client
  } else {
    // 1) Log error
    console.error('ERROR 💥💥', err);
    res.status(500).json({
      status: 'error',
      message: 'something went very wrong',
    });
  }
};

const handleCastErrorDB = (err: any) => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err: any) => {
  const message = `duplicate field value: ${JSON.stringify(err.keyValue)}. please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = (err: any) => {
  return new AppError('invalid token. please log in again!', 401);
};
const handleJWTExpiredError = (err: any) => {
  return new AppError('Your token has expired! please log in again', 401);
};
export default (err: any, req: Request, res: Response, next: NextFunction) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // this is a shallow copy
    if (err.name === 'CastError') {
      sendErrorProd(handleCastErrorDB(err), res);
      return;
    }
    if (err.code === 11000) {
      sendErrorProd(handleDuplicateFieldsDB(err), res);
      return;
    }
    if (err.name === 'ValidationError') {
      sendErrorProd(handleValidationErrorDB(err), res);
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      sendErrorProd(handleJWTError(err), res);
      return;
    }
    if (err.name === 'TokenExpiredError') {
      sendErrorProd(handleJWTExpiredError(err), res);
      return;
    }
    sendErrorProd(err, res);
  }
};
