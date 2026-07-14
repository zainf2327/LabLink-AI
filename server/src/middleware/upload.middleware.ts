import { Request, Response, NextFunction, RequestHandler } from 'express';

// Stub upload middleware: pass-through for now
export const uploadSingle = (fieldName: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    next();
  };
};
