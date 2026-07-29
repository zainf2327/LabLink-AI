import { api } from './api';

export interface Region {
  _id: string; // e.g. 'lahore_johar_town'
  city: string; // e.g. 'Lahore'
  name: string; // e.g. 'Johar Town'
  country: string; // e.g. 'Pakistan'
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetRegionsResponse {
  success: boolean;
  regions: Region[];
  total?: number;
  page?: number;
  pages?: number;
}

export const regionService = {
  async getRegions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    all?: boolean;
  }): Promise<GetRegionsResponse> {
    const response = await api.get('/regions', { params });
    return response.data;
  },

  async createRegion(data: {
    city: string;
    name: string;
    country: string;
  }): Promise<{ success: boolean; region: Region }> {
    const response = await api.post('/regions', data);
    return response.data;
  },

  async updateRegion(
    id: string,
    data: {
      city?: string;
      name?: string;
      country?: string;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; region: Region }> {
    const response = await api.patch(`/regions/${id}`, data);
    return response.data;
  },

  async deleteRegion(id: string): Promise<{ success: boolean; message: string; region: Region }> {
    const response = await api.delete(`/regions/${id}`);
    return response.data;
  },
};
