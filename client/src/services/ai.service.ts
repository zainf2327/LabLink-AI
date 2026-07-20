import { api } from './api';
import useAuthStore from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export interface ChatMessage {
  _id?: string;
  patientId: string;
  reportId: string;
  role: 'user' | 'assistant';
  content: string;
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
};
