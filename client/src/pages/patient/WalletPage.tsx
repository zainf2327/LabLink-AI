import React, { useState, useEffect, useCallback } from 'react';
import { walletService } from '../../services/wallet.service';
import type { WalletTransaction } from '../../services/wallet.service';
import {
  Wallet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
} from 'lucide-react';

import AppLayout from '../../components/layout/AppLayout';
import TopUpModal from '../../components/TopUpModal';

const LIMIT = 10;

const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const fetchAll = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        walletService.getWalletBalance(),
        walletService.getWalletTransactions(p, LIMIT),
      ]);
      if (balRes.success) setBalance(balRes.data.walletBalance);
      if (txRes.success) {
        setTransactions(txRes.data.transactions);
        setTotal(txRes.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(page);
  }, [fetchAll, page]);

  const handleTopUpSuccess = (newBalance: number) => {
    setBalance(newBalance);
    setPage(1);
    fetchAll(1);
    setTopUpOpen(false);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const reasonLabel: Record<string, string> = {
    cancellation_refund: 'Booking Cancellation Refund',
    booking_payment: 'Applied to Booking Payment',
    wallet_topup: 'Wallet Top-Up',
  };

  return (
    <AppLayout pageTitle="My Wallet">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Coins size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">My Wallet</h1>
              <p className="text-xs text-slate-500">Manage your credit balance and transaction history.</p>
            </div>
          </div>
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/10 shrink-0 cursor-pointer"
          >
            <Plus size={15} />
            Top Up
          </button>
        </div>

        {/* Balance Card - Soft light gradient theme with glow effects */}
        <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 border border-blue-100 shadow-sm shadow-blue-100/10">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-gradient-to-br from-teal-300/15 via-blue-400/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-500/10 pointer-events-none">
            <Wallet size={120} />
          </div>
          <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600/80 mb-2">
                Available Balance
              </p>
              <p className="text-5xl font-black text-slate-800 tracking-tight">
                {loading ? (
                  <span className="opacity-40 animate-pulse">$—</span>
                ) : (
                  `$${balance.toFixed(2)}`
                )}
              </p>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed max-w-md">
                Credits are automatically applied to your next booking before Stripe is charged. They never expire.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="glassmorphic-card rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={17} className="text-blue-600" />
            Transaction History
            <span className="ml-auto text-xs text-slate-400 font-normal">{total} total</span>
          </h2>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-150 border-t-blue-600 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No transactions yet. Credits will appear here after top-ups or booking cancellations.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100/80 hover:border-slate-200 hover:bg-white transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'credit'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-red-50 text-red-500 border border-red-100'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {reasonLabel[tx.reason] ?? tx.reason}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(tx.createdAt)}</p>
                    {tx.note && tx.reason !== 'wallet_topup' && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{tx.note}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <span
                    className={`text-sm font-extrabold shrink-0 ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-655 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-655 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top-Up Modal */}
      <TopUpModal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </AppLayout>
  );
};

export default WalletPage;