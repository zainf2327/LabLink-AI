import { api } from './api';

export interface Report {
  _id: string;
  bookingId: string;
  patientId: string;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  uploadedBy: string;
  tags: string[];
  textContent: string;
  vectorized: boolean;
  createdAt: string;
  updatedAt: string;
}

export const reportService = {
  async uploadReport(
    bookingId: string,
    file: File
  ): Promise<{ success: boolean; data: { report: Report } }> {
    const formData = new FormData();
    formData.append('bookingId', bookingId);
    formData.append('report', file);

    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMyReports(): Promise<{ success: boolean; data: { reports: Report[] } }> {
    const response = await api.get('/reports/me');
    return response.data;
  },

  async getReportById(id: string): Promise<{ success: boolean; data: { report: Report } }> {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  async deleteReport(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
};
