import { create } from 'zustand';
import { aiService } from '../services/ai.service';
import type { ChatMessage, ChatSession, ReferencedReport } from '../services/ai.service';

interface SessionState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  referencedReports: ReferencedReport[]; // Tracks citations of the current streaming message
  error: string | null;
}

interface AiState {
  sessions: Record<string, SessionState>;
  sessionsList: ChatSession[];
  activeSessionId: string | null;
  sessionsLoading: boolean;
  
  // Existing Report-Specific Chat Actions
  loadHistory: (reportId: string) => Promise<void>;
  sendMessage: (reportId: string, message: string) => Promise<void>;
  clearSession: (reportId: string) => void;

  // New Generalized Chat Session Actions
  setActiveSessionId: (sessionId: string | null) => void;
  fetchSessions: () => Promise<void>;
  createSession: () => Promise<string>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadGeneralHistory: (sessionId: string) => Promise<void>;
  sendGeneralMessage: (sessionId: string, message: string) => Promise<void>;
}

const initialSession = (): SessionState => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  referencedReports: [],
  error: null,
});

export const useAiStore = create<AiState>((set, get) => ({
  sessions: {},
  sessionsList: [],
  activeSessionId: null,
  sessionsLoading: false,

  setActiveSessionId: (sessionId) => {
    set({ activeSessionId: sessionId });
  },

  // Report-specific actions
  loadHistory: async (reportId) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [reportId]: {
          ...(state.sessions[reportId] || initialSession()),
          error: null,
        },
      },
    }));

    try {
      const response = await aiService.getChatHistory(reportId);
      if (response.success && response.data?.messages) {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [reportId]: {
              ...(state.sessions[reportId] || initialSession()),
              messages: response.data.messages,
            },
          },
        }));
      }
    } catch (err: any) {
      set((state) => ({
        sessions: {
          ...state.sessions,
          [reportId]: {
            ...(state.sessions[reportId] || initialSession()),
            error: err.response?.data?.message || 'Failed to load chat history.',
          },
        },
      }));
    }
  },

  sendMessage: async (reportId, message) => {
    const session = get().sessions[reportId] || initialSession();
    
    const userMsg: ChatMessage = {
      patientId: '',
      reportId,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      sessions: {
        ...state.sessions,
        [reportId]: {
          ...session,
          messages: [...session.messages, userMsg],
          isStreaming: true,
          streamingContent: '',
          referencedReports: [],
          error: null,
        },
      },
    }));

    try {
      const response = await aiService.streamChat(message, reportId);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Readable stream not supported in this browser.');
      }

      let accumulatedContent = '';
      let buffer = '';
      let lastUpdateTime = 0;
      const THROTTLE_MS = 60;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        
        buffer = parts.pop() || '';

        for (const part of parts) {
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;

          const lines = trimmedPart.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const rawData = line.substring(6).trim();
              if (rawData === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(rawData);
                if (parsed.token) {
                   accumulatedContent += parsed.token;
                  
                  const now = Date.now();
                  if (now - lastUpdateTime > THROTTLE_MS) {
                    lastUpdateTime = now;
                    set((state) => ({
                      sessions: {
                        ...state.sessions,
                        [reportId]: {
                          ...state.sessions[reportId],
                          streamingContent: accumulatedContent,
                        },
                      },
                    }));
                  }
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // ignore JSON parse exceptions for partial stream blocks
              }
            }
          }
        }
      }

      set((state) => ({
        sessions: {
          ...state.sessions,
          [reportId]: {
            ...state.sessions[reportId],
            streamingContent: accumulatedContent,
          },
        },
      }));

      const assistantMsg: ChatMessage = {
        patientId: '',
        reportId,
        role: 'assistant',
        content: accumulatedContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => {
        const currentSession = state.sessions[reportId] || initialSession();
        return {
          sessions: {
            ...state.sessions,
            [reportId]: {
              ...currentSession,
              messages: [...currentSession.messages, assistantMsg],
              isStreaming: false,
              streamingContent: '',
            },
          },
        };
      });
    } catch (err: any) {
      set((state) => {
        const currentSession = state.sessions[reportId] || initialSession();
        return {
          sessions: {
            ...state.sessions,
            [reportId]: {
              ...currentSession,
              isStreaming: false,
              error: err.message || 'An error occurred during response generation.',
            },
          },
        };
      });
    }
  },

  clearSession: (reportId) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [reportId]: initialSession(),
      },
    }));
  },

  // General Chat Sessions Actions implementation
  fetchSessions: async () => {
    set({ sessionsLoading: true });
    try {
      const res = await aiService.getSessions();
      if (res.success) {
        set({ sessionsList: res.data.sessions });
      }
    } catch (err) {
      console.error('Failed to fetch general chat sessions:', err);
    } finally {
      set({ sessionsLoading: false });
    }
  },

  createSession: async () => {
    try {
      const res = await aiService.createSession();
      if (res.success && res.data.session) {
        const newSession = res.data.session;
        set((state) => ({
          sessionsList: [newSession, ...state.sessionsList],
          activeSessionId: newSession._id,
        }));
        return newSession._id;
      }
      throw new Error('Failed to retrieve created session object');
    } catch (err) {
      console.error('Error creating session:', err);
      throw err;
    }
  },

  renameSession: async (sessionId, title) => {
    try {
      const res = await aiService.renameSession(sessionId, title);
      if (res.success && res.data.session) {
        set((state) => ({
          sessionsList: state.sessionsList.map((s) =>
            s._id === sessionId ? { ...s, title: res.data.session.title } : s
          ),
        }));
      }
    } catch (err) {
      console.error('Error renaming session:', err);
      throw err;
    }
  },

  deleteSession: async (sessionId) => {
    try {
      const res = await aiService.deleteSession(sessionId);
      if (res.success) {
        set((state) => {
          const updatedList = state.sessionsList.filter((s) => s._id !== sessionId);
          const nextActiveId =
            state.activeSessionId === sessionId
              ? updatedList[0]?._id || null
              : state.activeSessionId;

          // Delete session messages from the main map
          const updatedSessionsMap = { ...state.sessions };
          delete updatedSessionsMap[sessionId];

          return {
            sessionsList: updatedList,
            activeSessionId: nextActiveId,
            sessions: updatedSessionsMap,
          };
        });
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      throw err;
    }
  },

  loadGeneralHistory: async (sessionId) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...(state.sessions[sessionId] || initialSession()),
          error: null,
        },
      },
    }));

    try {
      const res = await aiService.getGeneralChatHistory(sessionId);
      if (res.success && res.data?.messages) {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...(state.sessions[sessionId] || initialSession()),
              messages: res.data.messages,
            },
          },
        }));
      }
    } catch (err: any) {
      set((state) => ({
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...(state.sessions[sessionId] || initialSession()),
            error: err.response?.data?.message || 'Failed to load general chat history.',
          },
        },
      }));
    }
  },

  sendGeneralMessage: async (sessionId, message) => {
    const session = get().sessions[sessionId] || initialSession();

    const userMsg: ChatMessage = {
      patientId: '',
      sessionId,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...session,
          messages: [...session.messages, userMsg],
          isStreaming: true,
          streamingContent: '',
          referencedReports: [],
          error: null,
        },
      },
    }));

    try {
      const response = await aiService.streamGeneralChat(message, sessionId);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Readable stream not supported in this browser.');
      }

      let accumulatedContent = '';
      let accumulatedCitations: ReferencedReport[] = [];
      let buffer = '';
      let lastUpdateTime = 0;
      const THROTTLE_MS = 60;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');

        buffer = parts.pop() || '';

        for (const part of parts) {
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;

          const lines = trimmedPart.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const rawData = line.substring(6).trim();
              if (rawData === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(rawData);
                if (parsed.token) {
                  accumulatedContent += parsed.token;

                  const now = Date.now();
                  if (now - lastUpdateTime > THROTTLE_MS) {
                    lastUpdateTime = now;
                    set((state) => ({
                      sessions: {
                        ...state.sessions,
                        [sessionId]: {
                          ...state.sessions[sessionId],
                          streamingContent: accumulatedContent,
                        },
                      },
                    }));
                  }
                } else if (parsed.referencedReports) {
                  accumulatedCitations = parsed.referencedReports;
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // ignore parse errors for partial blocks
              }
            }
          }
        }
      }

      set((state) => ({
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...state.sessions[sessionId],
            streamingContent: accumulatedContent,
            referencedReports: accumulatedCitations,
          },
        },
      }));

      const assistantMsg: ChatMessage = {
        patientId: '',
        sessionId,
        role: 'assistant',
        content: accumulatedContent,
        referencedReports: accumulatedCitations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => {
        const currentSession = state.sessions[sessionId] || initialSession();
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...currentSession,
              messages: [...currentSession.messages, assistantMsg],
              isStreaming: false,
              streamingContent: '',
              referencedReports: [],
            },
          },
        };
      });

      // Fetch general chat session list to refresh dynamically generated titles
      get().fetchSessions();

    } catch (err: any) {
      set((state) => {
        const currentSession = state.sessions[sessionId] || initialSession();
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...currentSession,
              isStreaming: false,
              error: err.message || 'An error occurred during response generation.',
            },
          },
        };
      });
    }
  },
}));
