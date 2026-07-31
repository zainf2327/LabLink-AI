import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
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
  Sparkles,
  FileText,
  FileDown,
  Compass,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { useAiStore } from '../../store/useAiStore';
import { reportService } from '../../services/report.service';
import type { Report } from '../../services/report.service';
import AppLayout from '../../components/layout/AppLayout';

// Suggestion chips when chat is empty
const SUGGESTION_CHIPS = [
  {
    label: 'Summarize key findings',
    prompt: 'Summarize the key findings from my diagnostic report in plain language.',
    icon: Sparkles,
  },
  {
    label: 'Check out-of-range biomarkers',
    prompt: 'Are there any values in my report that are outside the normal reference ranges? Please explain them.',
    icon: AlertCircle,
  },
  {
    label: 'Dietary & lifestyle guidance',
    prompt: 'Based on my test results, what dietary or lifestyle changes would you recommend to improve my biomarkers?',
    icon: Activity,
  },
  {
    label: 'Compare reference ranges',
    prompt: 'Can you compare my metrics to the standard clinical references and explain what high or low readings signify?',
    icon: Compass,
  },
];

// Left-pane quick shortcut questions
const LEFT_PANEL_SHORTCUTS = [
  {
    title: 'Explain Out-of-Range Metrics',
    prompt: 'Please list and explain all indicators in this report that fall outside standard ranges.',
  },
  {
    title: 'Biomarker Health Insights',
    prompt: 'How do my key biomarkers interact or impact overall health according to this test?',
  },
  {
    title: 'Follow-up Recommendations',
    prompt: 'What follow-up diagnostics, appointments, or medical actions are typical for these kinds of results?',
  },
];

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

  const location = useLocation();
  const initialPromptProcessed = useRef(false);

  useEffect(() => {
    if (reportId && location.state?.initialPrompt && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true;
      const initialPrompt = location.state.initialPrompt;
      setTimeout(() => {
        sendMessage(reportId, initialPrompt).catch((err) => {
          console.error('Failed to send initial prompt:', err);
        });
      }, 500);
      navigate(location.pathname, { replace: true });
    }
  }, [reportId, location, sendMessage, navigate]);

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
    if (isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isStreaming]);

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

  // Shortcut queries click handler
  const handleShortcutClick = async (promptText: string) => {
    if (!reportId || isStreaming) return;
    try {
      await sendMessage(reportId, promptText);
    } catch (err) {
      console.error('Failed to send shortcut message:', err);
    }
  };

  // Custom Markdown components for medical table/list formatting
  const markdownComponents = {
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-3 border border-zinc-850 rounded-xl max-w-full shadow-inner bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-xs" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-zinc-850" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-zinc-850/50" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-4 py-2.5 text-[10px] uppercase font-bold text-zinc-300 border-b border-zinc-800" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-4 py-2 text-zinc-200 border-b border-zinc-800/40 font-medium" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-350" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-350" {...props} />,
    p: ({ node, children, ...props }: any) => {
      let textContent = '';
      React.Children.forEach(children, (child) => {
        if (typeof child === 'string') {
          textContent += child;
        } else if (child && typeof child === 'object' && 'props' in child) {
          textContent += child.props.children || '';
        }
      });
      textContent = textContent.trim();

      const isDisclaimer = textContent.toLowerCase().includes('medical disclaimer') || 
                          textContent.toLowerCase().includes('educational context only') ||
                          textContent.toLowerCase().includes('not a substitute for advice');
      
      if (isDisclaimer) {
        const cleanText = textContent.replace(/^medical disclaimer:\s*/i, '');
        return (
          <div className="mt-3.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-semibold leading-relaxed flex items-start gap-2 shadow-inner">
            <span className="text-brand-600 shrink-0 font-bold uppercase tracking-widest bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded text-[8px] leading-none">Notice</span>
            <span className="flex-1 leading-snug text-zinc-400">{cleanText}</span>
          </div>
        );
      }
      return <p className="mb-2 last:mb-0 leading-relaxed text-zinc-200" {...props}>{children}</p>;
    },
    strong: ({ node, ...props }: any) => <strong className="font-extrabold text-slate-900 bg-brand-50 px-1 py-0.5 rounded text-[11px]" {...props} />,
    hr: ({ node, ...props }: any) => <hr className="my-3.5 border-zinc-800/40" {...props} />,
  };

  return (
    <AppLayout pageTitle="AI Medical Assistant">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-zinc-950 text-zinc-100 overflow-hidden">
        
        {/* Left Pane: Report Context & Quick Actions (Desktop only) */}
        <div className="hidden lg:flex lg:w-[380px] lg:flex-col lg:border-r lg:border-zinc-800 lg:bg-zinc-900/40 lg:p-5 lg:overflow-y-auto lg:shrink-0 lg:space-y-5">
          {/* Diagnostic Report Info Card */}
          <div className="glassmorphic-card rounded-2xl p-5 border border-zinc-800 bg-white space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-brand-50 text-brand-500 shrink-0">
                <FileText size={18} />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="text-[9px] uppercase font-black tracking-widest text-brand-500 block">
                  Diagnostic Report
                </span>
                <h3 className="text-xs font-bold text-zinc-100 truncate leading-snug">
                  {reportLoading ? 'Loading details...' : getReportTitle(report)}
                </h3>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-[11px] font-semibold text-zinc-400">
              <div className="flex justify-between">
                <span>Upload Date</span>
                <span className="text-zinc-200">
                  {report?.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Format</span>
                <span className="text-zinc-200 font-bold">PDF Document</span>
              </div>
              <div className="flex justify-between">
                <span>RAG Processing</span>
                <span className="text-brand-500 flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping"></span>
                  Active
                </span>
              </div>
            </div>

            {report?.fileUrl && (
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl border border-zinc-800 hover:border-brand-500 bg-white hover:bg-brand-50/20 text-xs font-bold text-zinc-300 hover:text-brand-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileDown size={14} />
                <span>Download Report PDF</span>
              </a>
            )}
          </div>

          {/* AI Clinical Summary Card */}
          {report && (report.summary || report.vectorized) && (
            <div className="glassmorphic-card rounded-2xl p-5 border border-zinc-800 bg-white space-y-3.5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
                <FileCheck size={16} className="text-teal-500" />
                <span className="text-xs font-bold text-zinc-200">Plain-Language Summary</span>
              </div>
              {(() => {
                if (!report.summary) {
                  return (
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      AI Summary is compiling. Ask any questions in the chat in the meantime!
                    </p>
                  );
                }
                
                const parts = report.summary.split(/\n-+\n|\n\n-+\n/);
                const cleanSummary = parts[0]?.trim() || '';
                const disclaimer = parts[1]?.trim() || '';
                
                return (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-medium">
                      {cleanSummary}
                    </p>
                    {disclaimer && (
                      <div className="p-3 rounded-xl bg-zinc-955 border border-zinc-800 text-[10px] text-zinc-400 font-semibold leading-relaxed flex items-start gap-2 shadow-inner">
                        <span className="text-brand-600 shrink-0 font-bold uppercase tracking-widest bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded text-[8px] leading-none">Notice</span>
                        <span className="flex-1 leading-snug text-zinc-400">{disclaimer.replace(/^medical disclaimer:\s*/i, '')}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quick-Action Shortcuts */}
          <div className="glassmorphic-card rounded-2xl p-5 border border-zinc-800 bg-white space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
              <Sparkles size={14} className="text-brand-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-200">Suggested Enquiries</span>
            </div>
            <div className="space-y-2">
              {LEFT_PANEL_SHORTCUTS.map((shortcut, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleShortcutClick(shortcut.prompt)}
                  disabled={isStreaming}
                  className="w-full p-3 rounded-xl bg-zinc-950 hover:bg-brand-50/30 border border-zinc-800 hover:border-brand-200 transition-all text-left text-xs font-bold text-zinc-300 hover:text-brand-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group flex items-start justify-between gap-1.5"
                >
                  <span className="leading-snug">{shortcut.title}</span>
                  <span className="text-[10px] text-zinc-500 group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: AI Scoped Chat Console */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950/20">
          
          {/* Chat Header */}
          <div className="border-b border-zinc-800 bg-white/80 p-4 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Link
                to="/patient/dashboard"
                className="p-2 rounded-xl border border-zinc-800 bg-white hover:bg-zinc-950 hover:border-zinc-700 transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  <Activity size={14} className="text-brand-500 animate-pulse" />
                  <span>AI Scoped Chat Console</span>
                </h2>
                <p className="text-[11px] text-zinc-400 font-semibold truncate max-w-[180px] sm:max-w-md">
                  {reportLoading ? 'Loading details...' : getReportTitle(report)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-extrabold tracking-widest bg-teal-50 text-teal-600 px-2.5 py-0.5 rounded-full border border-teal-100 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                RAG Scoped
              </span>
            </div>
          </div>

          {/* Mobile Collapsible Summary Card */}
          {report && (report.summary || report.vectorized) && (
            <div className="lg:hidden border-b border-zinc-850 bg-zinc-900/30 p-3 shrink-0">
              <div className="glassmorphic-card rounded-xl border border-zinc-800 bg-white shadow-xs">
                <button
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-zinc-300 hover:text-zinc-100 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck size={14} className="text-teal-500" />
                    <span>Report Summary</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    {isSummaryExpanded ? 'Collapse ▲' : 'Expand ▼'}
                  </span>
                </button>

                {isSummaryExpanded && (
                  <div className="px-3.5 pb-3.5 border-t border-zinc-800/40 pt-2.5 max-h-40 overflow-y-auto">
                    {(() => {
                      if (!report.summary) {
                        return (
                          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                            Summary is not fully ready. It will load shortly.
                          </p>
                        );
                      }
                      
                      const parts = report.summary.split(/\n-+\n|\n\n-+\n/);
                      const cleanSummary = parts[0]?.trim() || '';
                      const disclaimer = parts[1]?.trim() || '';
                      
                      return (
                        <div className="space-y-3">
                          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-medium">
                            {cleanSummary}
                          </p>
                          {disclaimer && (
                            <div className="p-3 rounded-xl bg-zinc-955 border border-zinc-800 text-[10px] text-zinc-400 font-semibold leading-relaxed flex items-start gap-2 shadow-inner">
                              <span className="text-brand-600 shrink-0 font-bold uppercase tracking-widest bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded text-[8px] leading-none">Notice</span>
                              <span className="flex-1 leading-snug text-zinc-400">{disclaimer.replace(/^medical disclaimer:\s*/i, '')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Screen */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-thin">
            
            {/* Welcome Message */}
            <div className="flex gap-3 max-w-2xl bg-white border border-zinc-800 p-5 rounded-2xl shadow-xs">
              <div className="w-8.5 h-8.5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 shadow-sm">
                <Bot size={18} />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0 font-medium">
                <span className="text-[9px] uppercase font-bold tracking-widest text-teal-600 block">
                  LabLink AI Assistant
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed font-semibold">
                  Welcome to your secure diagnostic dashboard! I have carefully processed your results for <strong>{getReportTitle(report)}</strong>. 
                  <br />
                  <br />
                  You can ask me questions about your biomarker values, reference ranges, dietary impacts, or compare stats with previous diagnostic checks.
                </p>

                {/* Dynamic Suggestion Chips (Visible only when chat history is empty) */}
                {messages.length === 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-800/80">
                    <p className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-450 mb-2.5 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-brand-500 animate-pulse" />
                      <span>Suggested Starters</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTION_CHIPS.map((chip, cIdx) => {
                        const IconComponent = chip.icon;
                        return (
                          <button
                            key={cIdx}
                            onClick={() => sendMessage(reportId!, chip.prompt)}
                            disabled={isStreaming}
                            className="px-3 py-2 rounded-xl border border-zinc-800 hover:border-brand-300 bg-zinc-950 hover:bg-brand-50/20 text-[11px] font-bold text-zinc-300 hover:text-brand-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                          >
                            <IconComponent size={12} className="text-zinc-400" />
                            <span>{chip.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Logs */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-2xl animate-fade-in ${
                  msg.role === 'user'
                    ? 'ml-auto flex-row-reverse'
                    : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 border shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-brand-50 text-brand-600 border-brand-100 font-bold text-xs'
                      : 'bg-teal-50 text-teal-600 border-teal-100'
                  }`}
                >
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div 
                  className={`space-y-1.5 flex-1 min-w-0 p-4 rounded-2xl shadow-xs border ${
                    msg.role === 'user'
                      ? 'bg-brand-50/45 border-brand-100/60 rounded-tr-xs'
                      : 'bg-white border-zinc-800 rounded-tl-xs'
                  }`}
                >
                  <span
                    className={`text-[9px] uppercase font-extrabold tracking-widest block ${
                      msg.role === 'user' ? 'text-brand-600' : 'text-teal-600'
                    }`}
                  >
                    {msg.role === 'user' ? user?.name || 'You' : 'LabLink Assistant'}
                  </span>
                  <div className="text-xs text-zinc-200 leading-relaxed font-semibold markdown-body break-words">
                    <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming Assistant Response */}
            {isStreaming && streamingContent && (
              <div className="flex gap-3 max-w-2xl mr-auto animate-fade-in">
                <div className="w-8.5 h-8.5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 shadow-xs">
                  <Bot size={16} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0 p-4 rounded-2xl rounded-tl-xs bg-white border border-zinc-800 shadow-xs">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-teal-600 block">
                    LabLink Assistant
                  </span>
                  <div className="text-xs text-zinc-200 leading-relaxed font-semibold markdown-body break-words">
                    <ReactMarkdown components={markdownComponents}>{streamingContent}</ReactMarkdown>
                    <span className="inline-block w-1.5 h-3.5 bg-brand-400 ml-0.5 animate-pulse align-middle" />
                  </div>
                </div>
              </div>
            )}

            {/* Generating Indicator (Dot bounce before tokens start) */}
            {isStreaming && !streamingContent && (
              <div className="flex gap-3 max-w-2xl mr-auto animate-fade-in">
                <div className="w-8.5 h-8.5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 shadow-xs">
                  <Bot size={16} />
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl rounded-tl-xs bg-white border border-zinc-800 shadow-xs">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-teal-600 block">
                    LabLink Assistant
                  </span>
                  <div className="flex items-center gap-1.5 py-1.5 px-0.5">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex gap-3 max-w-2xl bg-red-50/50 border border-red-100 p-4 rounded-2xl animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0 border border-red-200 shadow-xs">
                  <AlertCircle size={16} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-red-500 block">
                    System Error
                  </span>
                  <p className="text-xs text-red-500 font-semibold">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="border-t border-zinc-800 bg-white/80 p-4 backdrop-blur-md shrink-0">
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-end gap-3 bg-white border border-zinc-800 focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/10 p-2 rounded-2xl shadow-sm transition-all">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about details, values, or compare other tests..."
                className="flex-1 max-h-32 min-h-[40px] bg-transparent text-xs text-zinc-100 outline-none resize-none px-3 py-2.5 font-medium placeholder-zinc-500 leading-relaxed"
                rows={1}
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="p-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white disabled:bg-zinc-850 disabled:text-zinc-650 transition-all shadow-sm cursor-pointer shrink-0 hover:scale-[1.02] disabled:scale-100 active:scale-98 animate-fade-in"
              >
                <Send size={14} />
              </button>
            </form>
            <div className="max-w-3xl mx-auto text-center mt-2 flex items-center justify-center gap-1.5 text-[9px] text-zinc-500 font-bold tracking-wider uppercase">
              <HelpCircle size={10} className="text-zinc-400" />
              <span>AI answers are scoped to your diagnostic context. Always consult a physician.</span>
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
};

export default AiAssistant;
