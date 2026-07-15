import { api } from './api';

export interface BookingTest {
  testId: string;
  name: string;
  price: number;
}

export interface BookingHomeSampling {
  requested: boolean;
  address?: string;
  scheduledAt?: string;
  assignedStaffId?: string | null;
  calendarEventId?: string | null;
}

export interface Booking {
  _id: string;
  patientId: string;
  forMemberId?: string | null;
  tests: BookingTest[];
  status:
    | 'pending_payment'
    | 'scheduled'
    | 'sample_collected'
    | 'in_lab'
    | 'report_ready'
    | 'completed'
    | 'cancelled';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponId?: string | null;
  homeSampling: BookingHomeSampling;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  bookingId: string | Booking;
  patientId: string;
  amount: number;
  currency: string;
  method: 'stripe';
  stripePaymentIntentId: string;
  status: 'pending' | 'succeeded' | 'failed';
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const bookingService = {
  async createBooking(data: {
    forMemberId?: string | null;
    tests: string[];
    couponCode?: string | null;
    homeSampling?: {
      requested: boolean;
      address?: string;
      scheduledAt?: string;
    };
    notes?: string;
  }): Promise<{ success: boolean; data: { booking: Booking } }> {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  async getMyBookings(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    success: boolean;
    data: { bookings: Booking[]; pagination: { page: number; limit: number; total: number } };
  }> {
    const response = await api.get('/bookings/me', { params: { page, limit } });
    return response.data;
  },

  async getBookingById(id: string): Promise<{ success: boolean; data: { booking: Booking } }> {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  async getAllBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    patientId?: string;
    date?: string;
  }): Promise<{
    success: boolean;
    data: { bookings: Booking[]; pagination: { page: number; limit: number; total: number } };
  }> {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  async updateBookingStatus(
    id: string,
    status: string
  ): Promise<{ success: boolean; data: { booking: Booking } }> {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },

  async cancelBooking(
    id: string
  ): Promise<{ success: boolean; message: string; data: { booking: Booking } }> {
    const response = await api.patch(`/bookings/${id}/cancel`);
    return response.data;
  },

  async assignStaff(
    id: string,
    assignedStaffId: string | null
  ): Promise<{ success: boolean; data: { booking: Booking } }> {
    const response = await api.patch(`/bookings/${id}/assign-staff`, { assignedStaffId });
    return response.data;
  },

  async createPaymentIntent(
    bookingId: string
  ): Promise<{ success: boolean; data: { clientSecret: string | null; paymentId: string } }> {
    const response = await api.post('/payments/create-intent', { bookingId });
    return response.data;
  },

  async confirmPayment(
    paymentIntentId: string
  ): Promise<{ success: boolean; message: string; data: { booking: Booking } }> {
    const response = await api.post('/payments/confirm', { paymentIntentId });
    return response.data;
  },

  async validateCoupon(
    code: string,
    totalAmount: number
  ): Promise<{
    success: boolean;
    data: {
      couponId: string;
      discountAmount: number;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
    };
  }> {
    const response = await api.post('/coupons/validate', { code, totalAmount });
    return response.data;
  },

  async getMyBillingHistory(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    success: boolean;
    data: { payments: Payment[]; pagination: { page: number; limit: number; total: number } };
  }> {
    const response = await api.get('/payments/me', { params: { page, limit } });
    return response.data;
  },
};
