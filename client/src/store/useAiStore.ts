import { create } from 'zustand';
import { aiService } from '../services/ai.service';
import type { ChatMessage } from '../services/ai.service';

interface SessionState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

interface AiState {
  sessions: Record<string, SessionState>;
  loadHistory: (reportId: string) => Promise<void>;
  sendMessage: (reportId: string, message: string) => Promise<void>;
  clearSession: (reportId: string) => void;
}

const initialSession = (): SessionState => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  error: null,
});

export const useAiStore = create<AiState>((set, get) => ({
  sessions: {},

  loadHistory: async (reportId) => {
    // Set loading/error flags to start fresh
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
      patientId: '', // backend assigns this
      reportId,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Append user message instantly to visual log, enable stream flag
    set((state) => ({
      sessions: {
        ...state.sessions,
        [reportId]: {
          ...session,
          messages: [...session.messages, userMsg],
          isStreaming: true,
          streamingContent: '',
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
                  set((state) => ({
                    sessions: {
                      ...state.sessions,
                      [reportId]: {
                        ...state.sessions[reportId],
                        streamingContent: accumulatedContent,
                      },
                    },
                  }));
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
}));
