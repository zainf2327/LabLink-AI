import asyncHandler from '../utils/asyncHandler.js';
import Report from '../models/Report.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import { aiAssistantService } from '../services/aiAssistant.service.js';
export const chatWithAssistant = asyncHandler(async (req, res) => {
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
    if (report.patientId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: Access to another patient\'s report is denied' });
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
    const result = await aiAssistantService.chatWithAssistant(req.user.id, reportId, message, chatHistory);
    // 5. SSE Headers setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (result.fallback) {
        // Send standard fallback message and close stream
        res.write(`data: ${JSON.stringify({ token: result.fallbackMessage })}\n\n`);
        // Save assistant fallback message to database
        await ChatMessage.create({
            patientId: req.user.id,
            reportId,
            role: 'assistant',
            content: result.fallbackMessage || '',
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
        // Append medical disclaimer
        const disclaimer = `\n\n---\n⚕️ *Medical Disclaimer: This AI provides informational summaries of your lab reports only. It is not a substitute for professional medical advice. Please consult your doctor.*`;
        res.write(`data: ${JSON.stringify({ token: disclaimer })}\n\n`);
        fullAssistantResponse += disclaimer;
        // Save assistant response to DB
        await ChatMessage.create({
            patientId: req.user.id,
            reportId,
            role: 'assistant',
            content: fullAssistantResponse,
        });
    }
    catch (err) {
        console.error('Error during streaming:', err);
        res.write(`data: ${JSON.stringify({ error: 'Error during generation: ' + err.message })}\n\n`);
    }
    finally {
        res.write('data: [DONE]\n\n');
        res.end();
    }
});
export const getChatHistory = asyncHandler(async (req, res) => {
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
    if (report.patientId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: Access to another patient\'s report is denied' });
        return;
    }
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
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
