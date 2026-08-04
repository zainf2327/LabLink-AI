import { Router } from 'express';
import {
  chatWithAssistant,
  getChatHistory,
  createSession,
  getSessions,
  renameSession,
  deleteSession,
  chatWithGeneralAssistant,
  getGeneralChatHistory,
} from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { resolveSubscription } from '../middleware/subscriptionResolver.middleware.js';
import { aiChatRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Patient-only AI chat assistant routes
router.use(authenticate, authorize('patient'), resolveSubscription);

// Report-specific chat
router.post('/chat', aiChatRateLimiter, chatWithAssistant);
router.get('/chat/history', getChatHistory);

// Generalized chat sessions
router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.patch('/sessions/:sessionId', renameSession);
router.delete('/sessions/:sessionId', deleteSession);

// Generalized chat interaction & history
router.post('/general-chat', aiChatRateLimiter, chatWithGeneralAssistant);
router.get('/sessions/:sessionId/history', getGeneralChatHistory);

export default router;
