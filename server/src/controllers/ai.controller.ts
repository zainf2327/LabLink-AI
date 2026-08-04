import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import Report from '../models/Report.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import ChatSession from '../models/ChatSession.model.js';
import { aiAssistantService } from '../services/aiAssistant.service.js';
import { appendMedicalDisclaimer, MEDICAL_DISCLAIMER } from '../utils/medicalDisclaimer.js';
import logger from '../utils/logger.js';

export const chatWithAssistant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { message, reportId } = req.body;

  if (!message || !reportId) {
    res.status(400).json({ success: false, message: 'message and reportId are required in body' });
    return;
  }

  // 1. Fetch Report and validate existence/ownership
  const report = await Report.findById(reportId);
  if (!report) {
    res.status(404).json({ success: false, message: 'Report not found' });
    return;
  }

  const patientIdStr = (report.patientId._id || report.patientId).toString();
  if (patientIdStr !== req.user.id) {
    res.status(403).json({ success: false, message: 'Forbidden: Access to another patient\'s report is denied' });
    return;
  }

  // 1.5 Enforce AI monthly question quota (per calendar month)
  const limit = req.subscription?.planSnapshot?.aiQuestionsPerMonth !== undefined
    ? req.subscription.planSnapshot.aiQuestionsPerMonth
    : 5;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const messageCount = await ChatMessage.countDocuments({
    patientId: req.user.id,
    role: 'user',
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  if (messageCount >= limit) {
    res.status(403).json({
      success: false,
      message: `You have reached your monthly limit of ${limit} AI questions for your current subscription plan. Please upgrade your plan to ask more questions.`,
    });
    return;
  }

  // 2. Fetch last 10 messages for sliding window history (excl. new message)
  const chatHistoryDocs = await ChatMessage.find({
    patientId: req.user.id,
    reportId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  // Reverse to get chronological order (oldest first)
  const chatHistory = chatHistoryDocs.reverse().map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // 3. Save new user message to database
  await ChatMessage.create({
    patientId: req.user.id,
    reportId,
    role: 'user',
    content: message,
  });

  // 4. Call chat assistant RAG service
  const result = await aiAssistantService.chatWithAssistant(
    req.user.id,
    reportId,
    message,
    chatHistory
  );

  // 5. SSE Headers setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (result.fallback) {
    const fallbackWithDisclaimer = appendMedicalDisclaimer(
      result.fallbackMessage || 'I do not have enough report context to answer that yet.'
    );

    res.write(`data: ${JSON.stringify({ token: fallbackWithDisclaimer })}\n\n`);
    
    await ChatMessage.create({
      patientId: req.user.id,
      reportId,
      role: 'assistant',
      content: fallbackWithDisclaimer,
    });

    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // 6. Stream tokens back to client
  let fullAssistantResponse = '';
  try {
    for await (const chunk of result.stream) {
      const token = chunk.content || '';
      fullAssistantResponse += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    const disclaimer = `\n\n---\n${MEDICAL_DISCLAIMER}`;
    res.write(`data: ${JSON.stringify({ token: disclaimer })}\n\n`);
    fullAssistantResponse += disclaimer;

    // Save assistant response to DB
    await ChatMessage.create({
      patientId: req.user.id,
      reportId,
      role: 'assistant',
      content: fullAssistantResponse,
    });
  } catch (err: any) {
    logger.error('Error during streaming:', err);
    res.write(`data: ${JSON.stringify({ error: 'Error during generation: ' + err.message })}\n\n`);
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export const getChatHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { reportId } = req.query;

  if (!reportId || typeof reportId !== 'string') {
    res.status(400).json({ success: false, message: 'reportId is required as a string in query parameters' });
    return;
  }

  // Fetch Report and validate existence/ownership
  const report = await Report.findById(reportId);
  if (!report) {
    res.status(404).json({ success: false, message: 'Report not found' });
    return;
  }

  const patientIdStr = (report.patientId._id || report.patientId).toString();
  if (patientIdStr !== req.user.id) {
    res.status(403).json({ success: false, message: 'Forbidden: Access to another patient\'s report is denied' });
    return;
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const page = parseInt(req.query.page as string) || 1;
  const skip = (page - 1) * limit;

  const messages = await ChatMessage.find({
    patientId: req.user.id,
    reportId,
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  const total = await ChatMessage.countDocuments({
    patientId: req.user.id,
    reportId,
  });

  res.status(200).json({
    success: true,
    data: {
      messages,
      total,
      page,
      limit,
    },
  });
});

export const createSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const session = await ChatSession.create({ patientId: req.user.id });
  res.status(201).json({ success: true, data: { session } });
});

export const getSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const sessions = await ChatSession.find({ patientId: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { sessions } });
});

export const renameSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const { sessionId } = req.params;
  const { title } = req.body;
  if (!title || !title.trim()) {
    res.status(400).json({ success: false, message: 'title is required' });
    return;
  }
  const session = await ChatSession.findById(sessionId);
  if (!session) {
    res.status(404).json({ success: false, message: 'Session not found' });
    return;
  }
  if (session.patientId.toString() !== req.user.id) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  session.title = title.trim();
  await session.save();
  res.status(200).json({ success: true, data: { session } });
});

export const deleteSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const { sessionId } = req.params;
  const session = await ChatSession.findById(sessionId);
  if (!session) {
    res.status(404).json({ success: false, message: 'Session not found' });
    return;
  }
  if (session.patientId.toString() !== req.user.id) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  await ChatSession.findByIdAndDelete(sessionId);
  await ChatMessage.deleteMany({ sessionId });
  res.status(200).json({ success: true, message: 'Session and history deleted successfully' });
});

export const chatWithGeneralAssistant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    res.status(400).json({ success: false, message: 'message and sessionId are required in body' });
    return;
  }

  const session = await ChatSession.findById(sessionId);
  if (!session) {
    res.status(404).json({ success: false, message: 'Session not found' });
    return;
  }
  if (session.patientId.toString() !== req.user.id) {
    res.status(403).json({ success: false, message: 'Forbidden: Access to another patient\'s session is denied' });
    return;
  }

  const limit = req.subscription?.planSnapshot?.aiQuestionsPerMonth !== undefined
    ? req.subscription.planSnapshot.aiQuestionsPerMonth
    : 5;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const messageCount = await ChatMessage.countDocuments({
    patientId: req.user.id,
    role: 'user',
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  if (messageCount >= limit) {
    res.status(403).json({
      success: false,
      message: `You have reached your monthly limit of ${limit} AI questions for your current subscription plan. Please upgrade your plan to ask more questions.`,
    });
    return;
  }

  const chatHistoryDocs = await ChatMessage.find({
    patientId: req.user.id,
    sessionId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const chatHistory = chatHistoryDocs.reverse().map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  await ChatMessage.create({
    patientId: req.user.id,
    sessionId,
    role: 'user',
    content: message,
  });

  const result = await aiAssistantService.chatWithGeneralAssistant(
    req.user.id,
    message,
    chatHistory
  );

  let citations: any[] = [];
  if (result.referencedReportIds && result.referencedReportIds.length > 0) {
    try {
      const reports = await Report.find({ _id: { $in: result.referencedReportIds } })
        .populate('bookingId', 'tests')
        .select('_id bookingId createdAt');

      citations = reports.map((r: any) => {
        const booking = r.bookingId as any;
        const testNames = booking?.tests ? booking.tests.map((t: any) => t.name) : [];
        return {
          _id: r._id,
          testNames,
          createdAt: r.createdAt,
        };
      });
    } catch (citErr) {
      logger.error('Error loading report details for citations:', citErr);
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (result.fallback) {
    const fallbackWithDisclaimer = appendMedicalDisclaimer(
      result.fallbackMessage || 'I do not have enough report context to answer that yet.'
    );

    res.write(`data: ${JSON.stringify({ token: fallbackWithDisclaimer })}\n\n`);
    
    await ChatMessage.create({
      patientId: req.user.id,
      sessionId,
      role: 'assistant',
      content: fallbackWithDisclaimer,
    });

    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  let fullAssistantResponse = '';
  try {
    for await (const chunk of result.stream) {
      const token = chunk.content || '';
      fullAssistantResponse += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    if (citations.length > 0) {
      res.write(`data: ${JSON.stringify({ referencedReports: citations })}\n\n`);
    }

    const disclaimer = `\n\n---\n${MEDICAL_DISCLAIMER}`;
    res.write(`data: ${JSON.stringify({ token: disclaimer })}\n\n`);
    fullAssistantResponse += disclaimer;

    await ChatMessage.create({
      patientId: req.user.id,
      sessionId,
      role: 'assistant',
      content: fullAssistantResponse,
      referencedReports: result.referencedReportIds,
    });

    const sessionMsgCount = await ChatMessage.countDocuments({ sessionId });
    if (sessionMsgCount === 2) {
      (async () => {
        try {
          const title = await aiAssistantService.generateSessionTitle(message, fullAssistantResponse);
          await ChatSession.findByIdAndUpdate(sessionId, { title });
        } catch (bgErr) {
          logger.error('Background title generation failed:', bgErr);
        }
      })();
    }

  } catch (err: any) {
    logger.error('Error during streaming general chat:', err);
    res.write(`data: ${JSON.stringify({ error: 'Error during generation: ' + err.message })}\n\n`);
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export const getGeneralChatHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { sessionId } = req.params;

  if (!sessionId) {
    res.status(400).json({ success: false, message: 'sessionId is required in params' });
    return;
  }

  const session = await ChatSession.findById(sessionId);
  if (!session) {
    res.status(404).json({ success: false, message: 'Session not found' });
    return;
  }
  if (session.patientId.toString() !== req.user.id) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }

  const messages = await ChatMessage.find({
    patientId: req.user.id,
    sessionId,
  })
    .sort({ createdAt: 1 })
    .populate({
      path: 'referencedReports',
      populate: {
        path: 'bookingId',
        select: 'tests',
      },
      select: 'bookingId createdAt',
    });

  const formattedMessages = messages.map((m) => {
    const formattedCitations = (m.referencedReports || []).map((r: any) => {
      if (!r) return null;
      const booking = r.bookingId as any;
      const testNames = booking?.tests ? booking.tests.map((t: any) => t.name) : [];
      return {
        _id: r._id,
        testNames,
        createdAt: r.createdAt,
      };
    }).filter(Boolean);

    return {
      _id: m._id,
      patientId: m.patientId,
      sessionId: m.sessionId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      referencedReports: formattedCitations,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      messages: formattedMessages,
    },
  });
});
