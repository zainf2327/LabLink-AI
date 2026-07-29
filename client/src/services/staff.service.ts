import { api } from './api';

export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: 'staff';
  isActive: boolean;
  isVerified: boolean;
  assignedRegions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetStaffResponse {
  success: boolean;
  data: {
    users: StaffMember[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export const staffService = {
  async getStaff(params?: {
    page?: number;
    limit?: number;
  }): Promise<GetStaffResponse> {
    const response = await api.get('/users', {
      params: {
        ...params,
        role: 'staff',
      },
    });
    return response.data;
  },

  async createStaff(data: { name: string; email: string }): Promise<{ success: boolean; data: { user: StaffMember } }> {
    const response = await api.post('/users/staff', data);
    return response.data;
  },

  async resetStaffPassword(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/users/staff/${id}/reset-password`);
    return response.data;
  },

  async updateStaffStatus(id: string, isActive: boolean): Promise<{ success: boolean; data: { user: StaffMember } }> {
    const response = await api.patch(`/users/${id}`, { isActive });
    return response.data;
  },

  async updateStaffRegions(id: string, regions: string[]): Promise<{ success: boolean; data: { user: StaffMember } }> {
    const response = await api.patch(`/users/${id}/regions`, { regions });
    return response.data;
  },
};
