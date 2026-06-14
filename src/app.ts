import express from 'express';
import helmet from 'helmet';
import AppError from './utils/appError';
import globalErrorHandler from './controllers/errorController';
const app = express();

app.use(helmet());
app.use(express.json());

app.all('/{*any}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);
export default app;
