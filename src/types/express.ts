import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface AuthRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: { id: string; email: string; role: string };
}
