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
};
