import { Request, Response, NextFunction, RequestHandler } from 'express';

// Stub auth middleware: passes request through to next middleware
export const authenticate: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  // A mock user can be attached for testing if needed
  // req.user = { id: 'mock-user-id', role: 'patient' };
  next();
};
