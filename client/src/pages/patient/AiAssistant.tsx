import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Activity,
  FileCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { useAiStore } from '../../store/useAiStore';
import { reportService } from '../../services/report.service';
import type { Report } from '../../services/report.service';
import AppLayout from '../../components/layout/AppLayout';

export const AiAssistant: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { sessions, loadHistory, sendMessage, clearSession } = useAiStore();
  const { user } = useAuthStore();

  const [inputMessage, setInputMessage] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const session = reportId ? sessions[reportId] : null;
  const messages = session?.messages || [];
  const isStreaming = session?.isStreaming || false;
  const streamingContent = session?.streamingContent || '';
  const error = session?.error || null;

  // 1. Redirect if reportId is missing
  useEffect(() => {
    if (!reportId) {
      navigate('/patient/dashboard');
    }
  }, [reportId, navigate]);

  // 2. Fetch report metadata and history on mount
  useEffect(() => {
    if (reportId) {
      setReportLoading(true);
      reportService
        .getReportById(reportId)
        .then((res) => {
          if (res.success && res.data?.report) {
            setReport(res.data.report);
          }
        })
        .catch((err) => {
          console.error('Failed to load report metadata:', err);
        })
        .finally(() => {
          setReportLoading(false);
        });

      loadHistory(reportId);
    }

    return () => {
      // Clean session state when leaving chat
      if (reportId) {
        clearSession(reportId);
      }
    };
  }, [reportId, loadHistory, clearSession]);

  // 3. Scroll to bottom whenever messages or streamingContent updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 4. Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !reportId || isStreaming) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');

    try {
      await sendMessage(reportId, messageToSend);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Helper to format report titles
  const getReportTitle = (rep: Report | null): string => {
    if (!rep) return 'Loading Report...';
    if (rep.bookingId && typeof rep.bookingId === 'object' && (rep.bookingId as any).tests) {
      return (rep.bookingId as any).tests.map((t: any) => t.name).join(', ');
    }
    return `Diagnostic Report (${rep._id.substring(18).toUpperCase()})`;
  };

  return (
    <AppLayout pageTitle="AI Medical Assistant">
      <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-950 text-zinc-100">
        
        {/* Chat Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/patient/dashboard"
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-zinc-400 hover:text-zinc-200"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <Activity size={14} className="text-purple-400" />
                <span>AI Scoped Chat</span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-semibold truncate max-w-[240px] sm:max-w-md">
                {reportLoading ? 'Loading report details...' : getReportTitle(report)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
              RAG Scoped
            </span>
          </div>
        </div>

        {/* Collapsible Summary Card */}
        {report && (report.summary || report.vectorized) && (
          <div className="border-b border-zinc-850 bg-zinc-900/30 p-4">
            <div className="glassmorphic-card rounded-xl border border-zinc-800/80 bg-zinc-900/40">
              <button
                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-zinc-300 hover:text-zinc-100 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileCheck size={14} className="text-teal-400" />
                  <span>Report Plain-Language Summary</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold">
                  {isSummaryExpanded ? 'Collapse ▲' : 'Expand ▼'}
                </span>
              </button>

              {isSummaryExpanded && (
                <div className="px-4 pb-4 border-t border-zinc-800/40 pt-3">
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {report.summary || 'Summary is not fully ready. It will load shortly.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Screen */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* Welcome Message */}
          <div className="flex gap-3 max-w-2xl bg-zinc-900/20 border border-zinc-850 p-4 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Bot size={16} />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                LabLink Assistant
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Welcome! I have processed your report: <strong>{getReportTitle(report)}</strong>. 
                You can ask me questions about your results, reference ranges, or any comparisons with your previous tests.
              </p>
            </div>
          </div>

          {/* Chat Logs */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-2xl ${
                msg.role === 'user'
                  ? 'ml-auto bg-emerald-500/5 border border-emerald-500/10'
                  : 'bg-zinc-900/40 border border-zinc-850'
              } p-4 rounded-2xl`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  msg.role === 'user'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}
              >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="space-y-1.5 flex-1 overflow-x-auto">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider block ${
                    msg.role === 'user' ? 'text-emerald-400' : 'text-purple-400'
                  }`}
                >
                  {msg.role === 'user' ? user?.name || 'You' : 'LabLink Assistant'}
                </span>
                <div className="text-xs text-zinc-300 leading-relaxed markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming Assistant Response */}
          {isStreaming && streamingContent && (
            <div className="flex gap-3 max-w-2xl bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                <Bot size={16} />
              </div>
              <div className="space-y-1.5 flex-1 overflow-x-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">
                  LabLink Assistant
                </span>
                <div className="text-xs text-zinc-300 leading-relaxed markdown-body">
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  <span className="inline-block w-1.5 h-3.5 bg-purple-400 ml-0.5 animate-pulse align-middle" />
                </div>
              </div>
            </div>
          )}

          {/* Generating Indicator (Dot bounce before tokens start) */}
          {isStreaming && !streamingContent && (
            <div className="flex gap-3 max-w-2xl bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                <Bot size={16} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">
                  LabLink Assistant
                </span>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 max-w-2xl bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <AlertCircle size={16} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 block">
                  System Error
                </span>
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="border-t border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-end gap-3 bg-zinc-950 border border-zinc-850 p-2.5 rounded-2xl shadow-inner focus-within:border-purple-500/50 transition-all">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about details, values, or compare other tests..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent text-xs text-zinc-200 outline-none resize-none px-2 py-2.5 font-medium placeholder-zinc-550 leading-relaxed"
              rows={1}
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="p-3.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black disabled:bg-zinc-850 disabled:text-zinc-600 transition-all shadow-md cursor-pointer shrink-0 hover:scale-[1.02] disabled:scale-100"
            >
              <Send size={14} />
            </button>
          </form>
          <div className="max-w-3xl mx-auto text-center mt-2 flex items-center justify-center gap-1 text-[10px] text-zinc-500 font-semibold tracking-wide">
            <HelpCircle size={10} className="text-zinc-650" />
            <span>AI answers are scoped to your diagnostic context. Always consult a physician.</span>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default AiAssistant;
