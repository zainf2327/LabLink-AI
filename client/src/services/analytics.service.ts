import { api } from './api';

export interface OverviewData {
  totalBookings: number;
  totalRevenue: number;
  newPatientsCount: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
}

export interface TopTest {
  testId: string;
  name: string;
  bookingsCount: number;
}

export const analyticsService = {
  async getOverview(params?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: OverviewData }> {
    const response = await api.get('/analytics/overview', { params });
    return response.data;
  },

  async getBookingsTrends(params?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: { trends: BookingTrend[] } }> {
    const response = await api.get('/analytics/bookings', { params });
    return response.data;
  },

  async getRevenueTrends(params?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: { trends: RevenueTrend[] } }> {
    const response = await api.get('/analytics/revenue', { params });
    return response.data;
  },

  async getTopTests(params?: { categoryId?: string }): Promise<{ success: boolean; data: { topTests: TopTest[] } }> {
    const response = await api.get('/analytics/top-tests', { params });
    return response.data;
  },
};
