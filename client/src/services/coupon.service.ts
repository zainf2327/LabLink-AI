import { api } from './api';

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number | null;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const couponService = {
  async getAllCoupons(): Promise<{ success: boolean; data: { coupons: Coupon[] } }> {
    const response = await api.get('/coupons');
    return response.data;
  },

  async getCouponById(id: string): Promise<{ success: boolean; data: { coupon: Coupon } }> {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
  },

  async createCoupon(couponData: Partial<Coupon>): Promise<{ success: boolean; data: { coupon: Coupon } }> {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },

  async updateCoupon(id: string, couponData: Partial<Coupon>): Promise<{ success: boolean; data: { coupon: Coupon } }> {
    const response = await api.patch(`/coupons/${id}`, couponData);
    return response.data;
  },

  async deleteCoupon(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },
};
