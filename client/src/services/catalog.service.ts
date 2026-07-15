import { api } from './api';

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Test {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  type: 'lab' | 'radiology';
  categoryId: string | { _id: string; name: string };
  price: number;
  preparationInstructions?: string;
  duration: string;
  isHomeCollectionAvailable: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetTestsResponse {
  success: boolean;
  tests: Test[];
  total: number;
  page: number;
  pages: number;
}

export const catalogService = {
  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    const response = await api.get('/test-categories');
    return response.data;
  },

  async createCategory(data: Partial<Category>): Promise<{ success: boolean; category: Category }> {
    const response = await api.post('/test-categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<{ success: boolean; category: Category }> {
    const response = await api.patch(`/test-categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/test-categories/${id}`);
    return response.data;
  },

  async getTests(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    type?: string;
    search?: string;
  }): Promise<GetTestsResponse> {
    const response = await api.get('/tests', { params });
    return response.data;
  },

  async getTestById(id: string): Promise<{ success: boolean; test: Test }> {
    const response = await api.get(`/tests/${id}`);
    return response.data;
  },

  async createTest(data: Partial<Test>): Promise<{ success: boolean; test: Test }> {
    const response = await api.post('/tests', data);
    return response.data;
  },

  async updateTest(id: string, data: Partial<Test>): Promise<{ success: boolean; test: Test }> {
    const response = await api.patch(`/tests/${id}`, data);
    return response.data;
  },

  async deactivateTest(id: string): Promise<{ success: boolean; message: string; test: Test }> {
    const response = await api.delete(`/tests/${id}`);
    return response.data;
  },
};
