import multer from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Configure multer storage in memory to keep the file buffer accessible for text extraction and S3
const storage = multer.memoryStorage();

// Restrict uploads strictly to PDF files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!') as any);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export const uploadSingle = (fieldName: string): RequestHandler => {
  const multerMiddleware = upload.single(fieldName);
  
  return (req: Request, res: Response, next: NextFunction): void => {
    multerMiddleware(req, res, (err: any) => {
      if (err) {
        // Map multer or filter errors to a clean message
        const error = new Error(err.message || 'File upload failed') as any;
        error.statusCode = 400;
        return next(error);
      }
      next();
    });
  };
};
