import { api } from './api';

export interface Report {
  _id: string;
  bookingId:
    | string
    | {
        _id?: string;
        tests?: Array<{ testId?: string; name: string; price?: number }>;
      };
  patientId: string;
  fileUrl?: string;
  fileKey: string;
  mimeType: string;
  uploadedBy: string;
  tags: string[];
  textContent?: string;
  vectorized: boolean;
  summary?: string;
  summaryGeneratedAt?: string | null;
  versionSuffix?: string;
  lastViewedAt?: string | null;
  accessLog?: Array<{
    viewedBy?: {
      name: string;
    };
    viewedAt: string;
    role: string;
  }>;
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

  async getReportBlob(
    id: string,
    mode: 'view' | 'download',
    onProgress?: (percent: number) => void
  ): Promise<Blob> {
    try {
      const response = await api.get(`/reports/${id}/${mode}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          err.message = parsed.message || err.message;
          err.response.data = parsed;
        } catch {
          // Fallback text
        }
      }
      throw err;
    }
  },
};

