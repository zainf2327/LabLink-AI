import { Request, Response, NextFunction, RequestHandler } from 'express';

// Stub role check middleware: always passes through for now
export const authorize = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    next();
  };
};
