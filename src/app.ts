import express from 'express';
import helmet from 'helmet';
import AppError from './utils/appError';
import globalErrorHandler from './controllers/errorController';
import userRouter from './routes/userRoutes';
import morgan from 'morgan';
// import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
const app = express();

// Security
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(hpp());
// app.use(cors({
//   origin: 'http://localhost:3000', // Replace with production frontend URL
//   credentials: true // Strictly required for the browser to send HttpOnly cookies
// }));
app.use(
  rateLimit({
    limit: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour',
  })
);

app.use(cookieParser());

app.use(morgan('dev'));

// app.use(mongoSanitize()); old and unmaintained package
mongoose.set('sanitizeFilter', true);

app.use('/api/v1/users', userRouter);

app.all('/{*any}', (req, res, next) => {
  console.log('hello');
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);
export default app;
