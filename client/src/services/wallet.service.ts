import { api } from './api';

export interface WalletTransaction {
  _id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: 'cancellation_refund' | 'booking_payment' | 'wallet_topup';
  bookingId?: string | null;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export const walletService = {
  async getWalletBalance(): Promise<{ success: boolean; data: { walletBalance: number } }> {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  async getWalletTransactions(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    success: boolean;
    data: {
      transactions: WalletTransaction[];
      pagination: { page: number; limit: number; total: number };
    };
  }> {
    const response = await api.get('/wallet/transactions', { params: { page, limit } });
    return response.data;
  },

  async createTopUpIntent(amount: number): Promise<{
    success: boolean;
    data: { clientSecret: string; paymentIntentId: string };
  }> {
    const response = await api.post('/wallet/topup/intent', { amount });
    return response.data;
  },

  async confirmTopUp(paymentIntentId: string): Promise<{
    success: boolean;
    message: string;
    data: { walletBalance: number; creditAmount: number };
  }> {
    const response = await api.post('/wallet/topup/confirm', { paymentIntentId });
    return response.data;
  },
};
