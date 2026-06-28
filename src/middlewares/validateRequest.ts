import { NextFunction, Request, Response } from 'express';
import z from 'zod';
export const validateRequest = <T extends z.ZodObject<z.core.$ZodShape>>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      console.log('validation successful');
      next();
    } catch (err) {
      next(err);
    }
  };
};
