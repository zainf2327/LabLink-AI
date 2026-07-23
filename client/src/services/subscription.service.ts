import { api } from './api';

export interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  maxFamilyMembers: number;
  features: string[];
  isActive: boolean;
  durationMonths?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  planId: SubscriptionPlan | string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  renewalDate?: string;
  expiryDate?: string;
  activeFamilyMemberIds?: any[];
  needsFamilySelection?: boolean;
  planSnapshot?: any;
  createdAt: string;
  updatedAt: string;
}

export const subscriptionService = {
  // Public / Patient endpoints
  async getAllPlans(): Promise<{ success: boolean; plans: SubscriptionPlan[] }> {
    const response = await api.get('/subscription-plans');
    return response.data;
  },

  async getMySubscription(): Promise<{ success: boolean; subscription: Subscription | null }> {
    const response = await api.get('/subscriptions/me');
    return response.data;
  },

  async createSubscriptionIntent(planId: string): Promise<{
    success: boolean;
    data: {
      clientSecret: string | null;
      paymentId: string;
      stripePaymentIntentId: string;
      walletAmountUsed: number;
      stripeAmount: number;
    };
  }> {
    const response = await api.post('/subscriptions/create-intent', { planId });
    return response.data;
  },

  async confirmSubscriptionPayment(paymentIntentId: string): Promise<{ success: boolean; message: string; subscription: Subscription }> {
    const response = await api.post('/subscriptions/confirm-payment', { paymentIntentId });
    return response.data;
  },

  async updateActiveFamilyMembers(activeFamilyMemberIds: string[]): Promise<{ success: boolean; message: string; subscription: Subscription }> {
    const response = await api.patch('/subscriptions/me/family-members', { activeFamilyMemberIds });
    return response.data;
  },

  async getMySubscriptionHistory(): Promise<{ success: boolean; data: Subscription[] }> {
    const response = await api.get('/subscriptions/history');
    return response.data;
  },

  async cancelMySubscription(): Promise<{ success: boolean; message: string }> {
    const response = await api.patch('/subscriptions/me/cancel');
    return response.data;
  },

  // Admin endpoints
  async createPlan(data: Omit<SubscriptionPlan, '_id' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; plan: SubscriptionPlan }> {
    const response = await api.post('/subscription-plans', data);
    return response.data;
  },

  async updatePlan(id: string, data: Partial<SubscriptionPlan>): Promise<{ success: boolean; message: string; plan: SubscriptionPlan }> {
    const response = await api.patch(`/subscription-plans/${id}`, data);
    return response.data;
  },

  async deactivatePlan(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/subscription-plans/${id}`);
    return response.data;
  },

  async getAllSubscriptions(page = 1, limit = 10): Promise<{
    success: boolean;
    data: {
      subscriptions: Subscription[];
      pagination: {
        page: number;
        limit: number;
        total: number;
      };
    };
  }> {
    const response = await api.get('/subscriptions', { params: { page, limit } });
    return response.data;
  },
};
