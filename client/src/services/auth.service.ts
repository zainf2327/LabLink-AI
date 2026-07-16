import { api } from './api';
import type { AuthResponse, UserResponse, RefreshResponse } from '../types/auth';

export const authService = {
  async register(data: { name: string; email: string; password?: string; phone?: string }): Promise<{ success: boolean; message: string; user: any }> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: { email: string; password?: string }): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async refresh(): Promise<RefreshResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async getMe(): Promise<UserResponse> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async getGoogleCalendarConnectUrl(): Promise<{ success: boolean; url: string }> {
    const response = await api.get('/auth/google/calendar');
    return response.data;
  },

  async disconnectGoogleCalendar(): Promise<{ success: boolean; message: string }> {
    const response = await api.delete('/auth/google/calendar');
    return response.data;
  },

  async getStaffUsers(): Promise<{ success: boolean; data: { staff: any[] } }> {
    const response = await api.get('/users/staff');
    return response.data;
  },
};
