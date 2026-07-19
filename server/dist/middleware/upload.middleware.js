import multer from 'multer';
// Configure multer storage in memory to keep the file buffer accessible for text extraction and S3
const storage = multer.memoryStorage();
// Restrict uploads strictly to PDF files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    else {
        cb(new Error('Only PDF files are allowed!'));
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
export const uploadSingle = (fieldName) => {
    const multerMiddleware = upload.single(fieldName);
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (err) {
                // Map multer or filter errors to a clean message
                const error = new Error(err.message || 'File upload failed');
                error.statusCode = 400;
                return next(error);
            }
            next();
        });
    };
};
