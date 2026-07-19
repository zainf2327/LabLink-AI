import { Router } from 'express';
import { chatWithAssistant, getChatHistory } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
const router = Router();
// Patient-only AI chat assistant routes
router.use(authenticate, authorize('patient'));
router.post('/chat', chatWithAssistant);
router.get('/chat/history', getChatHistory);
export default router;
