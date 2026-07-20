import { api } from './api';

export interface FamilyMember {
  _id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  relationship: string;
  gender: 'male' | 'female' | 'other';
}

export const familyService = {
  async getMyFamilyMembers(): Promise<{ success: boolean; data: FamilyMember[] }> {
    try {
      const response = await api.get('/family-members');
      return response.data;
    } catch (error) {
      console.warn('Family members endpoint not implemented yet. Returning empty list.');
      return { success: true, data: [] };
    }
  },

  async createFamilyMember(data: Omit<FamilyMember, '_id' | 'userId'>): Promise<{ success: boolean; message: string; familyMember: FamilyMember }> {
    const response = await api.post('/family-members', data);
    return response.data;
  },

  async updateFamilyMember(id: string, data: Partial<Omit<FamilyMember, '_id' | 'userId'>>): Promise<{ success: boolean; message: string; familyMember: FamilyMember }> {
    const response = await api.patch(`/family-members/${id}`, data);
    return response.data;
  },

  async deleteFamilyMember(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/family-members/${id}`);
    return response.data;
  },
};
