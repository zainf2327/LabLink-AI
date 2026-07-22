import { Router } from 'express';
import { uploadReport, getMyReports, getReportById, deleteReport, viewReportFile, downloadReportFile } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
const router = Router();
// Apply auth to all report routes
router.use(authenticate);
// Staff uploads report file
router.post('/', authorize('staff'), uploadSingle('report'), uploadReport);
// Patient retrieves own report list
router.get('/me', authorize('patient'), getMyReports);
// Stream report file inline (for viewer)
router.get('/:id/view', authorize('patient', 'staff', 'admin'), viewReportFile);
// Stream report file as renamed attachment download
router.get('/:id/download', authorize('patient', 'staff', 'admin'), downloadReportFile);
// Read report detail (metadata + file url)
router.get('/:id', authorize('patient', 'staff', 'admin'), getReportById);
// Admin-only deletion
router.delete('/:id', authorize('admin'), deleteReport);
export default router;
