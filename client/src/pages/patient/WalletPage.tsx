import React, { useState, useEffect, useCallback } from 'react';
import { walletService } from '../../services/wallet.service';
import type { WalletTransaction } from '../../services/wallet.service';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import AppLayout from '../../components/layout/AppLayout';

const LIMIT = 10;

const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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
  };

  return (
    <AppLayout pageTitle="My Wallet">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-teal-900/60 via-teal-950/80 to-zinc-950 border border-teal-700/30 shadow-xl shadow-teal-900/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-400/80 mb-2">
            Available Balance
          </p>
          <p className="text-5xl font-extrabold text-teal-100 tracking-tight">
            {loading ? (
              <span className="opacity-40 animate-pulse">$—</span>
            ) : (
              `$${balance.toFixed(2)}`
            )}
          </p>
          <p className="text-xs text-teal-400/60 mt-3 leading-relaxed max-w-sm">
            Credits are automatically applied to your next booking before Stripe is charged.
            They never expire.
          </p>
        </div>

        {/* Transaction History */}
        <div className="glassmorphic-card rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Wallet size={17} className="text-teal-500" />
            Transaction History
            <span className="ml-auto text-xs text-zinc-500 font-normal">{total} total</span>
          </h2>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No transactions yet. Wallet credits appear here after booking cancellations.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/60 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'credit'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 truncate">
                      {reasonLabel[tx.reason] ?? tx.reason}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                    {tx.note && (
                      <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{tx.note}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <span
                    className={`text-sm font-extrabold shrink-0 ${
                      tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
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
                className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default WalletPage;
