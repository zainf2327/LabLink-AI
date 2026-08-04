import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Bot,
  User,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Loader2,
  MessageSquare,
  Activity,
  ArrowRight,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { useAiStore } from '../../store/useAiStore';
import AppLayout from '../../components/layout/AppLayout';

// Suggestion chips when chat is empty
const SUGGESTIONS = [
  {
    label: 'Analyze overall biomarkers',
    prompt: 'Based on all my uploaded reports, what biomarkers should I watch or improve?',
    icon: Activity,
  },
  {
    label: 'Diet and lifestyle tips',
    prompt: 'What dietary or lifestyle suggestions do you have based on my latest lab results?',
    icon: Sparkles,
  },
  {
    label: 'Explain high/low values',
    prompt: 'Can you explain what high or low indicators in my blood panel typically signify?',
    icon: AlertCircle,
  },
  {
    label: 'General medical inquiry',
    prompt: 'I want to ask a general medical question about symptoms and healthy prevention habits.',
    icon: HelpCircle,
  },
];

export const GeneralAiAssistant: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuthStore();
  const {
    sessions,
    sessionsList,
    activeSessionId,
    sessionsLoading,
    setActiveSessionId,
    fetchSessions,
    createSession,
    renameSession,
    deleteSession,
    loadGeneralHistory,
    sendGeneralMessage,
  } = useAiStore();

  const [inputMessage, setInputMessage] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch sessions list on mount
  useEffect(() => {
    fetchSessions().then(() => {
      // If there are sessions and no active session selected, select the first one
      if (sessionsList.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionsList[0]._id);
      }
    });
  }, []);

  // 2. Load history when active session changes
  useEffect(() => {
    if (activeSessionId) {
      loadGeneralHistory(activeSessionId);
    }
  }, [activeSessionId]);

  const activeSession = activeSessionId ? sessions[activeSessionId] : null;
  const messages = activeSession?.messages || [];
  const isStreaming = activeSession?.isStreaming || false;
  const streamingContent = activeSession?.streamingContent || '';
  const streamingCitations = activeSession?.referencedReports || [];
  const error = activeSession?.error || null;

  // 3. Scroll to bottom on updates
  useEffect(() => {
    if (isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isStreaming]);

  // 4. Create new chat thread
  const handleNewChat = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const newId = await createSession();
      setActiveSessionId(newId);
      setInputMessage('');
    } catch (err) {
      console.error('Failed to create new chat session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSessionId || isStreaming) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');

    try {
      await sendGeneralMessage(activeSessionId, messageToSend);
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

  // 6. Delete session
  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation thread?')) return;
    try {
      await deleteSession(id);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // 7. Rename session
  const startRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const saveRename = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      await renameSession(id, editingTitle.trim());
      setEditingSessionId(null);
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  };

  const cancelRename = () => {
    setEditingSessionId(null);
  };

  // Custom Markdown components for medical table/list formatting
  const markdownComponents = {
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-3 border border-zinc-800 rounded-xl max-w-full shadow-inner bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-xs" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-zinc-850" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-zinc-800" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-4 py-2.5 text-[10px] uppercase font-bold text-zinc-300 border-b border-zinc-800 animate-fade-in" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-4 py-2 text-zinc-100 border-b border-zinc-850 font-medium" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-300" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-300" {...props} />,
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
          <div className="mt-3.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-450 font-semibold leading-relaxed flex items-start gap-2 shadow-inner">
            <span className="text-brand-600 shrink-0 font-bold uppercase tracking-widest bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded text-[8px] leading-none">Notice</span>
            <span className="flex-1 leading-snug text-zinc-400">{cleanText}</span>
          </div>
        );
      }
      return <p className="mb-2 last:mb-0 leading-relaxed text-zinc-150 text-xs md:text-sm font-medium" {...props}>{children}</p>;
    },
    strong: ({ node, ...props }: any) => <strong className="font-extrabold text-slate-900 bg-brand-50 px-1 py-0.5 rounded text-[11px]" {...props} />,
    hr: ({ node, ...props }: any) => <hr className="my-3.5 border-zinc-800/40" {...props} />,
  };

  return (
    <AppLayout pageTitle="AI Assistant">
      <div className="flex h-[calc(100vh-4.5rem)] rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xs">
        
        {/* Left Pane: Sessions Sidebar */}
        <div className="w-64 sm:w-72 border-r border-zinc-800 bg-white flex flex-col h-full shrink-0 select-none">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={13} className="text-brand-500" />
              <span>Conversations</span>
            </h3>
            <button
              onClick={handleNewChat}
              disabled={actionLoading}
              className="p-1.5 rounded-lg border border-zinc-850 hover:border-brand-200 bg-zinc-950 hover:bg-brand-50 text-zinc-400 hover:text-brand-600 transition-all cursor-pointer disabled:opacity-55"
              title="Start a new chat session"
            >
              {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {sessionsLoading && sessionsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-450 gap-2">
                <Loader2 size={20} className="animate-spin text-brand-500" />
                <span className="text-[10px] font-semibold uppercase">Loading chats...</span>
              </div>
            ) : sessionsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 text-zinc-500 gap-1.5">
                <MessageSquare size={20} className="text-zinc-600 animate-bounce" />
                <p className="text-[10px] font-bold uppercase tracking-wider">No chats yet</p>
                <p className="text-[9px] font-semibold text-zinc-450 leading-snug">
                  Click the plus icon above to start your first secure consultation.
                </p>
              </div>
            ) : (
              sessionsList.map((s) => {
                const isActive = s._id === activeSessionId;
                const isEditing = s._id === editingSessionId;

                return (
                  <div
                    key={s._id}
                    onClick={() => !isEditing && setActiveSessionId(s._id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 border-blue-100 text-blue-700 shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(s._id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white border border-blue-300 rounded px-1.5 py-0.5 text-xs text-slate-800 outline-hidden font-bold focus:ring-1 focus:ring-blue-400"
                          autoFocus
                        />
                      ) : (
                        <p className="text-xs font-bold truncate leading-tight">
                          {s.title}
                        </p>
                      )}
                      <span className="text-[8px] text-zinc-500 block mt-0.5 font-bold uppercase tracking-wider">
                        {new Date(s.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startRename(e, s._id, s.title)}
                          className="p-1 rounded-md text-zinc-450 hover:text-brand-600 hover:bg-brand-50/50 transition-all cursor-pointer"
                          title="Rename thread"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(e, s._id)}
                          className="p-1 rounded-md text-zinc-450 hover:text-red-600 hover:bg-red-50/50 transition-all cursor-pointer"
                          title="Delete thread"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveRename(s._id);
                          }}
                          className="p-0.5 text-green-600 hover:bg-green-50 rounded transition-all cursor-pointer"
                        >
                          <Check size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelRename();
                          }}
                          className="p-0.5 text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: AI Scoped Chat Console */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950/20">
          
          {activeSessionId ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-zinc-800 bg-white/80 p-4 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-brand-500 animate-pulse animate-duration-[2000ms]" />
                  <div>
                    <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 leading-snug">
                      {sessionsList.find((s) => s._id === activeSessionId)?.title || 'AI Medical Assistant'}
                    </h2>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                      Autonomous Patient Consultant
                    </span>
                  </div>
                </div>

                <span className="text-[9px] uppercase font-extrabold tracking-widest bg-teal-50 text-teal-600 px-2.5 py-0.5 rounded-full border border-teal-100 flex items-center gap-1.5 shadow-xs shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                  Multi-Report RAG
                </span>
              </div>

              {/* Messages Screen */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-thin">
                
                {/* Onboarding Welcome Message */}
                <div className="flex gap-3 max-w-2xl bg-white border border-zinc-800 p-5 rounded-2xl shadow-xs">
                  <div className="w-8.5 h-8.5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 shadow-inner">
                    <Bot size={18} />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0 font-medium">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-teal-600 block">
                      LabLink AI Health Guide
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed font-semibold">
                      Welcome to your secure diagnostic dashboard! I have synchronized all of your uploaded medical reports and vector indexes.
                      <br />
                      <br />
                      You can ask me questions about your biomarker values, reference ranges, lifestyle recommendations, or check comparative health logs across reports.
                    </p>

                    {/* Suggestion Starters (Visible only when active session has no messages) */}
                    {messages.length === 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-800/80">
                        <p className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-450 mb-2 flex items-center gap-1.5">
                          <Sparkles size={11} className="text-brand-500 animate-pulse" />
                          <span>Suggested Starters</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {SUGGESTIONS.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInputMessage(item.prompt)}
                              className="p-2.5 rounded-xl border border-zinc-850 hover:border-brand-200 bg-zinc-950 hover:bg-brand-50 text-left text-[11px] font-bold text-zinc-350 hover:text-brand-600 transition-all flex items-start gap-2 cursor-pointer group hover:scale-[1.01]"
                            >
                              <item.icon size={13} className="text-zinc-500 group-hover:text-brand-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Mapping */}
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex gap-3 max-w-3xl animate-fade-in ${
                        isUser ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 border shadow-xs ${
                          isUser
                            ? 'bg-zinc-850 text-zinc-200 border-zinc-800'
                            : 'bg-teal-50 text-teal-600 border-teal-100 shadow-inner'
                        }`}
                      >
                        {isUser ? <User size={15} /> : <Bot size={17} />}
                      </div>

                      <div className={`space-y-1.5 flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
                        <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-450 block">
                          {isUser ? user?.name || 'You' : 'LabLink AI'}
                        </span>
                        
                        <div
                          className={`p-4 rounded-2xl border text-left text-xs md:text-sm font-medium leading-relaxed shadow-xs ${
                            isUser
                              ? 'bg-blue-50 border-blue-100 text-blue-900 rounded-tr-none'
                              : 'bg-white border-zinc-800 text-zinc-100 rounded-tl-none'
                          }`}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-line">{msg.content}</p>
                          ) : (
                            <ReactMarkdown components={markdownComponents}>
                              {msg.content}
                            </ReactMarkdown>
                          )}

                          {/* Referenced Citation Cards */}
                          {!isUser && msg.referencedReports && msg.referencedReports.length > 0 && (
                            <div className="mt-4 pt-3.5 border-t border-zinc-800/80">
                              <p className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-450 mb-2 flex items-center gap-1.5">
                                <FileText size={11} className="text-teal-650" />
                                <span>Referenced Reports ({msg.referencedReports.length})</span>
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2.5">
                                {msg.referencedReports.map((citation) => (
                                  <div
                                    key={citation._id}
                                    onClick={() => window.open(`/patient/reports/${citation._id}/ai-assistant`, '_blank')}
                                    className="p-3 rounded-xl border border-zinc-850 hover:border-brand-200 bg-zinc-950 hover:bg-brand-50 flex items-center justify-between gap-2.5 transition-all cursor-pointer hover:scale-[1.01] shadow-xs group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-zinc-850 group-hover:bg-brand-100 text-zinc-400 group-hover:text-brand-600 flex items-center justify-center shrink-0 transition-colors">
                                        <FileText size={13} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-zinc-250 group-hover:text-brand-600 truncate leading-snug">
                                          {citation.testNames && citation.testNames.length > 0
                                            ? citation.testNames.join(', ')
                                            : 'Diagnostic Report'}
                                        </p>
                                        <span className="text-[8px] text-zinc-500 font-bold block mt-0.5 uppercase tracking-wider">
                                          Uploaded: {new Date(citation.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                    <ArrowRight size={11} className="text-zinc-500 group-hover:translate-x-0.5 group-hover:text-brand-500 transition-all shrink-0" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Streaming Response Bubble */}
                {isStreaming && streamingContent && (
                  <div className="flex gap-3 max-w-3xl animate-fade-in">
                    <div className="w-8.5 h-8.5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 shadow-inner">
                      <Bot size={17} />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-450 block">
                        LabLink AI
                      </span>
                      <div className="p-4 rounded-2xl border bg-white border-zinc-800 text-zinc-100 rounded-tl-none text-left text-xs md:text-sm font-medium leading-relaxed shadow-xs">
                        <ReactMarkdown components={markdownComponents}>
                          {streamingContent}
                        </ReactMarkdown>

                        {/* Citations while streaming (if any) */}
                        {streamingCitations.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-zinc-800/80">
                            <p className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-450 mb-2 flex items-center gap-1.5">
                              <FileText size={11} className="text-teal-650" />
                              <span>Referenced Reports ({streamingCitations.length})</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2.5 animate-fade-in">
                              {streamingCitations.map((citation) => (
                                <div
                                  key={citation._id}
                                  onClick={() => window.open(`/patient/reports/${citation._id}/ai-assistant`, '_blank')}
                                  className="p-3 rounded-xl border border-zinc-850 hover:border-brand-200 bg-zinc-950 hover:bg-brand-50 flex items-center justify-between gap-2.5 transition-all cursor-pointer hover:scale-[1.01] shadow-xs group"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-zinc-850 group-hover:bg-brand-100 text-zinc-400 group-hover:text-brand-600 flex items-center justify-center shrink-0 transition-colors">
                                      <FileText size={13} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold text-zinc-250 group-hover:text-brand-600 truncate leading-snug">
                                        {citation.testNames && citation.testNames.length > 0
                                          ? citation.testNames.join(', ')
                                          : 'Diagnostic Report'}
                                      </p>
                                      <span className="text-[8px] text-zinc-500 font-bold block mt-0.5 uppercase tracking-wider">
                                        Uploaded: {new Date(citation.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowRight size={11} className="text-zinc-500 group-hover:translate-x-0.5 group-hover:text-brand-500 transition-all shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-500 flex items-start gap-2.5 animate-bounce">
                    <AlertCircle size={15} className="shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-bold">Chat Error</p>
                      <p className="font-medium mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Console */}
              <div className="p-4 border-t border-zinc-800 bg-white/70 backdrop-blur-md shrink-0">
                <form onSubmit={handleSendMessage} className="relative">
                  <textarea
                    rows={2}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={
                      isStreaming ? 'AI is generating a response...' : 'Ask about your biomarkers, trends, or medical health...'
                    }
                    disabled={isStreaming}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-450 outline-hidden font-medium text-xs md:text-sm text-zinc-200 placeholder-zinc-500 resize-none transition-all scrollbar-none"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isStreaming}
                    className="absolute right-3.5 bottom-3.5 p-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-zinc-850 text-white disabled:text-zinc-550 transition-all shrink-0 cursor-pointer shadow-xs disabled:cursor-not-allowed hover:scale-[1.02]"
                  >
                    {isStreaming ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                  </button>
                </form>

                <div className="flex flex-col sm:flex-row justify-between gap-1.5 mt-2 px-1 text-[9px] text-zinc-500 font-semibold leading-relaxed">
                  <span>Questions limit resets at the start of each calendar month.</span>
                  <span className="flex items-center gap-1.5 text-zinc-450 select-none">
                    <AlertCircle size={9} />
                    Safe Medical Advisory Context Enabled
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Onboarding / On Selection Empty Console */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner mb-4 animate-pulse">
                <Bot size={34} />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-150 uppercase tracking-widest mb-1.5">
                LabLink AI Chatbot
              </h3>
              <p className="text-xs font-semibold text-zinc-400 leading-relaxed max-w-sm">
                Unlock full medical insights. Synchronize and query trends across all your uploaded laboratory diagnostics. 
              </p>
              <button
                onClick={handleNewChat}
                disabled={actionLoading}
                className="mt-5 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55"
              >
                {actionLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={13} />
                    <span>Create Consultation Thread</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
};

export default GeneralAiAssistant;
