import { api } from './api';
import useAuthStore from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export interface ReferencedReport {
  _id: string;
  testNames: string[];
  createdAt: string;
}

export interface ChatMessage {
  _id?: string;
  patientId: string;
  reportId?: string;
  sessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  referencedReports?: ReferencedReport[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  _id: string;
  patientId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface GeneralChatHistoryResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
  };
}

export interface ChatSessionsResponse {
  success: boolean;
  data: {
    sessions: ChatSession[];
  };
}

export interface ChatSessionResponse {
  success: boolean;
  data: {
    session: ChatSession;
  };
}

export const aiService = {
  async streamChat(message: string, reportId: string): Promise<Response> {
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ message, reportId }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to connect to assistant');
    }

    return response;
  },

  async getChatHistory(reportId: string, page = 1, limit = 50): Promise<ChatHistoryResponse> {
    const response = await api.get('/ai/chat/history', {
      params: { reportId, page, limit },
    });
    return response.data;
  },

  // General Chat Sessions API
  async createSession(): Promise<ChatSessionResponse> {
    const response = await api.post('/ai/sessions');
    return response.data;
  },

  async getSessions(): Promise<ChatSessionsResponse> {
    const response = await api.get('/ai/sessions');
    return response.data;
  },

  async renameSession(sessionId: string, title: string): Promise<ChatSessionResponse> {
    const response = await api.patch(`/ai/sessions/${sessionId}`, { title });
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/ai/sessions/${sessionId}`);
    return response.data;
  },

  async streamGeneralChat(message: string, sessionId: string): Promise<Response> {
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(`${API_URL}/ai/general-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to connect to assistant');
    }

    return response;
  },

  async getGeneralChatHistory(sessionId: string): Promise<GeneralChatHistoryResponse> {
    const response = await api.get(`/ai/sessions/${sessionId}/history`);
    return response.data;
  },
};
