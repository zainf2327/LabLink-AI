import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { walletService } from '../services/wallet.service';
import { useToast } from '../hooks/useToast';
import {
  X,
  Wallet,
  CreditCard,
  CheckCircle,
  Loader,
  Coins,
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PRESET_AMOUNTS = [10, 25, 50, 100];

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1e293b', // slate-800 text for readability in light mode
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: '14px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
};

interface TopUpFormProps {
  onSuccess: (newBalance: number, creditAmount: number) => void;
  onClose: () => void;
}

const TopUpForm: React.FC<TopUpFormProps> = ({ onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [step, setStep] = useState<'amount' | 'card' | 'success'>('amount');
  const [loading, setLoading] = useState(false);

  const resolvedAmount = useCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount ?? 0;

  const handleContinueToCard = async () => {
    if (resolvedAmount < 1) { toast.error('Please enter an amount of at least $1.00'); return; }
    if (resolvedAmount > 500) { toast.error('Maximum single top-up is $500.00'); return; }
    setLoading(true);
    try {
      const res = await walletService.createTopUpIntent(resolvedAmount);
      setClientSecret(res.data.clientSecret);
      setStep('card');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) { toast.error('Stripe has not initialized.'); return; }
    if (!cardName.trim()) { toast.error('Please enter the cardholder name.'); return; }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { toast.error('Card element missing.'); return; }

    setLoading(true);
    try {
      const stripeResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement, billing_details: { name: cardName } },
      });
      if (stripeResult.error) {
        toast.error(stripeResult.error.message || 'Payment failed. Please check your card details.');
        setLoading(false);
        return;
      }
      if (stripeResult.paymentIntent?.status === 'succeeded') {
        const confirmRes = await walletService.confirmTopUp(stripeResult.paymentIntent.id);
        if (confirmRes.success) {
          toast.success(`$${confirmRes.data.creditAmount.toFixed(2)} added to your wallet!`);
          setStep('success');
          onSuccess(confirmRes.data.walletBalance, confirmRes.data.creditAmount);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment confirmation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Amount step ─── */
  if (step === 'amount') {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">Quick Select</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setUseCustom(false); }}
                className={`py-3 rounded-xl font-bold text-sm transition-all border cursor-pointer ${
                  !useCustom && selectedAmount === amt
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">Custom Amount</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
            <input
              type="number"
              min={1}
              max={500}
              step="0.01"
              placeholder="Enter amount (1 – 500)"
              value={customAmount}
              onFocus={() => setUseCustom(true)}
              onChange={(e) => { setCustomAmount(e.target.value); setUseCustom(true); }}
              className={`w-full pl-8 pr-4 py-3 rounded-xl bg-white border text-sm text-slate-700 placeholder-slate-400 focus:outline-none transition-all ${
                useCustom ? 'border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 focus:border-blue-300'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
          <span className="text-sm text-slate-500">You will be charged</span>
          <span className="text-xl font-extrabold text-blue-600">
            {resolvedAmount >= 1 ? `$${resolvedAmount.toFixed(2)}` : '—'}
          </span>
        </div>

        <button
          onClick={handleContinueToCard}
          disabled={loading || resolvedAmount < 1}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <><CreditCard size={15} /> Continue to Payment</>}
        </button>
      </div>
    );
  }

  /* ─── Card step ─── */
  if (step === 'card') {
    return (
      <form onSubmit={handleConfirmPayment} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet size={16} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Top-up amount</p>
            <p className="text-base font-extrabold text-blue-600">${resolvedAmount.toFixed(2)}</p>
          </div>
          <button type="button" onClick={() => setStep('amount')} className="ml-auto text-xs text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
            Change
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Cardholder Name</label>
          <input
            type="text"
            placeholder="Jane Doe"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Card Details</label>
          <div className="px-4 py-3 rounded-xl bg-white border border-slate-200 focus-within:border-blue-500/50 transition-all">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          Payments are processed securely by Stripe. LabLink never stores card data.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <><Loader size={16} className="animate-spin" /> Processing…</> : <><CreditCard size={15} /> Confirm Top-Up · ${resolvedAmount.toFixed(2)}</>}
        </button>
      </form>
    );
  }

  /* ─── Success step ─── */
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center">
        <CheckCircle size={32} className="text-emerald-500" />
      </div>
      <div>
        <h3 className="text-lg font-extrabold text-slate-800">Top-Up Successful!</h3>
        <p className="text-sm text-slate-500 mt-1">Your wallet balance has been updated.</p>
      </div>
      <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all cursor-pointer">
        Done
      </button>
    </div>
  );
};

/* ─── Modal wrapper ─── */

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number, creditAmount: number) => void;
}

const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Coins size={17} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Top Up Wallet</h2>
            <p className="text-xs text-slate-400">Credits never expire · applied automatically at checkout</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-slate-450 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <Elements stripe={stripePromise}>
            <TopUpForm onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default TopUpModal;