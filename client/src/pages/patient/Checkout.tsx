import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import { bookingService } from '../../services/booking.service';
import { walletService } from '../../services/wallet.service';
import { familyService } from '../../services/family.service';
import type { FamilyMember } from '../../services/family.service'
''
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Trash2,
  Calendar,
  MapPin,
  Tag,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader,
  Home,
  FileText,
  Wallet,
} from 'lucide-react';

// Initialize Stripe Promise
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, removeItem, clearCart } = useCartStore();

  const stripe = useStripe();
  const elements = useElements();

  // Booking details states
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [requestHomeSampling, setRequestHomeSampling] = useState(false);
  const [address, setAddress] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Flow control states
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [paymentSecret, setPaymentSecret] = useState<string | null>(null);
  const [walletAmountUsed, setWalletAmountUsed] = useState<number>(0);
  const [stripeChargeAmount, setStripeChargeAmount] = useState<number>(0);

  // Credit Card states
  const [cardName, setCardName] = useState('');

  // Calculate pricing
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const afterCoupon = Math.max(0, subtotal - discount);
  // Wallet covers up to afterCoupon amount
  const walletApplied = Math.min(walletBalance, afterCoupon);
  const finalTotal = Math.max(0, afterCoupon - walletApplied);

  useEffect(() => {
    // Redirect if cart is empty and not on success step
    if (items.length === 0 && step !== 'success') {
      navigate('/tests');
    }
  }, [items, navigate, step]);

  useEffect(() => {
    if (errorMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errorMessage]);

  useEffect(() => {
    // Fetch family members
    const fetchFamily = async () => {
      const res = await familyService.getMyFamilyMembers();
      if (res.success && res.data) {
        setFamilyMembers(res.data);
      }
    };
    fetchFamily();

    // Fetch wallet balance
    const fetchWallet = async () => {
      try {
        const res = await walletService.getWalletBalance();
        if (res.success) {
          setWalletBalance(res.data.walletBalance);
        }
      } catch {
        // Wallet fetch is non-critical — fail silently
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    try {
      const res = await bookingService.validateCoupon(couponCode, subtotal);
      if (res.success) {
        setAppliedCoupon(res.data);
        setCouponError(null);
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Failed to validate coupon');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate appointment scheduling details (required for all)
    if (!scheduledAt) {
      setErrorMessage('Please select a scheduled date and time.');
      return;
    }
    if (new Date(scheduledAt) <= new Date()) {
      setErrorMessage('Appointment slot must be in the future.');
      return;
    }

    // Validate home collection eligibility
    if (requestHomeSampling) {
      const unavailableTest = items.find((item) => !item.isHomeCollectionAvailable);
      if (unavailableTest) {
        setErrorMessage(`Home collection is not available for test: "${unavailableTest.name}"`);
        return;
      }

      if (!address.trim()) {
        setErrorMessage('Please enter an address for home sampling collection.');
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Create booking (POST /bookings)
      const bookingRes = await bookingService.createBooking({
        forMemberId: selectedMemberId || null,
        tests: items.map((t) => t._id || ''),
        couponCode: appliedCoupon ? couponCode : null,
        homeSampling: {
          requested: requestHomeSampling,
          address: requestHomeSampling ? address : undefined,
          scheduledAt,
        },
        notes,
      });

      if (bookingRes.success) {
        const booking = bookingRes.data.booking;
        setCreatedBooking(booking);

        // 2. Create Payment Intent (also triggers wallet deduction server-side)
        const intentRes = await bookingService.createPaymentIntent(booking._id);
        if (intentRes.success) {
          const { clientSecret, walletAmountUsed: wUsed, stripeAmount } = intentRes.data;
          setWalletAmountUsed(wUsed);
          setStripeChargeAmount(stripeAmount);

          // 3. Handle Zero-Value / Wallet-Covered Checkout Bypass
          if (!clientSecret || stripeAmount === 0) {
            clearCart();
            setCreatedBooking((prev: any) => prev ? { ...prev, status: 'scheduled' } : prev);
            setStep('success');
          } else {
            setPaymentSecret(clientSecret);
            setStep('payment');
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!stripe || !elements || !paymentSecret) {
      setErrorMessage('Stripe has not initialized. Please try again.');
      return;
    }

    if (!cardName.trim()) {
      setErrorMessage('Please enter the cardholder name.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage('Payment element missing.');
      return;
    }

    setLoading(true);
    try {
      // 1. Confirm Card Payment client-side with Stripe
      const stripeResult = await stripe.confirmCardPayment(paymentSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardName,
            email: user?.email || undefined,
          },
        },
      });

      if (stripeResult.error) {
        setErrorMessage(stripeResult.error.message || 'Payment failed. Please check card details.');
        setLoading(false);
        return;
      }

      if (stripeResult.paymentIntent && stripeResult.paymentIntent.status === 'succeeded') {
        // 2. Call backend confirmation with real payment intent ID
        const confirmRes = await bookingService.confirmPayment(stripeResult.paymentIntent.id);
        if (confirmRes.success) {
          clearCart();
          setCreatedBooking(confirmRes.data.booking);
          setStep('success');
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Payment confirmation failed. Please check card details.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex flex-col justify-center items-center px-4 py-12">
        <div className="glassmorphic-card max-w-xl w-full p-8 rounded-3xl text-center border-emerald-500/30 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-pulse">
            <CheckCircle className="text-emerald-400" size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Booking Confirmed!
            </h2>
            <p className="text-zinc-400 text-sm">
              Thank you for trusting LabLink AI. Your payment has been received successfully.
            </p>
          </div>

          <div className="w-full bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800 text-left space-y-3">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Booking ID</span>
              <span className="font-mono text-zinc-300 font-bold">{createdBooking?._id}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Patient Name</span>
              <span className="text-zinc-300 font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Scheduled Status</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold border border-emerald-500/20">
                {createdBooking?.status}
              </span>
            </div>
            {walletAmountUsed > 0 && (
              <div className="flex justify-between text-xs text-zinc-500 border-t border-zinc-800 pt-2">
                <span className="text-teal-600 flex items-center gap-1">
                  <Wallet size={11} />
                  Wallet Credit Used
                </span>
                <span className="text-teal-600 font-semibold">${walletAmountUsed.toFixed(2)}</span>
              </div>
            )}
            {stripeChargeAmount > 0 && (
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Charged via Stripe</span>
                <span className="text-zinc-300 font-semibold">${stripeChargeAmount.toFixed(2)}</span>
              </div>
            )}
            {createdBooking?.homeSampling?.requested && (
              <div className="pt-2 border-t border-zinc-800 space-y-1">
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Home size={12} />
                  <span>Home Sampling Scheduled</span>
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Address: {createdBooking?.homeSampling?.address}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Time: {new Date(createdBooking?.homeSampling?.scheduledAt).toLocaleString()}
                </p>
                <p className="text-[11px] text-teal-400 flex items-center gap-1 mt-1">
                  <Calendar size={12} />
                  <span>Google Calendar Event Scheduled: {createdBooking?.homeSampling?.calendarEventId}</span>
                </p>
              </div>
            )}
          </div>

          <div className="w-full grid grid-cols-2 gap-4">
            <Link
              to="/tests"
              className="px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm font-semibold transition-all text-center"
            >
              Browse Catalog
            </Link>
            <Link
              to="/patient/dashboard"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/tests" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-semibold">
            <ArrowLeft size={16} />
            <span>Back to Tests</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Left Columns: Form Steps */}
        <div className="lg:col-span-2 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleDetailsSubmit} className="glassmorphic-card p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-900 pb-3">
                <MapPin size={18} className="text-emerald-400" />
                <span>Scheduling & Details</span>
              </h3>

              {/* Patient Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Testing For
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full py-3 px-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="" className="bg-zinc-950">Jane Doe (Self)</option>
                  {familyMembers.map((member) => (
                    <option key={member._id} value={member._id} className="bg-zinc-950">
                      {member.name} ({member.relationship})
                    </option>
                  ))}
                </select>
              </div>

              {/* Home Sampling Toggle */}
              <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/20 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestHomeSampling}
                    onChange={(e) => setRequestHomeSampling(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-zinc-200 block">Request Home Sampling Collection</span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      A certified lab technician will visit your address to collect samples.
                    </span>
                  </div>
                </label>

                {requestHomeSampling && (
                  <div className="pt-4 border-t border-zinc-900 space-y-4 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                        Collection Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House/Apt No., Street, City"
                        className="w-full py-3 px-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Preferred Date & Time Slot (Always Visible) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Preferred Date & Time Slot
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full py-3 px-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                />
              </div>

              {/* Special Notes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please call before arriving, or patient is wheelchair bound."
                  className="w-full py-3 px-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 min-h-24 resize-none"
                />
              </div>

              {/* Checkout / Proceed Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-850 disabled:text-zinc-500 text-black text-sm font-bold shadow-lg shadow-emerald-500/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span>Creating Booking...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="glassmorphic-card p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-900 pb-3">
                <CreditCard size={18} className="text-emerald-400" />
                <span>Secure Stripe Checkout</span>
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs leading-relaxed">
                  Payments are secured by Stripe. You can complete this checkout using standard test cards (e.g. 4242 4242...).
                </div>

                {/* Cardholder Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Secure Card Element */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Card Details
                  </label>
                  <div className="w-full px-4 py-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-250">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            color: '#0f172a', // Tailwind zinc-100 dark text
                            fontFamily: 'Inter, sans-serif',
                            fontSmoothing: 'antialiased',
                            fontSize: '14px',
                            '::placeholder': {
                              color: '#94a3b8', // Tailwind zinc-600 light placeholder
                            },
                          },
                          invalid: {
                            color: '#dc2626', // Tailwind red-400 dark red
                            iconColor: '#dc2626',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Pay Now Button */}
              <button
                type="submit"
                disabled={loading || !stripe}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:bg-zinc-850 disabled:text-zinc-500 text-black text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay ${stripeChargeAmount.toFixed(2)}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="glassmorphic-card rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" />
              <span>Cart Summary</span>
            </h3>

            {/* Wallet balance pill */}
            {!walletLoading && walletBalance > 0 && (
              <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-2">
                <span className="text-xs text-teal-600 flex items-center gap-1.5 font-semibold">
                  <Wallet size={13} />
                  Wallet Balance
                </span>
                <span className="text-xs font-extrabold text-teal-600">${walletBalance.toFixed(2)}</span>
              </div>
            )}

            {/* Test items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((test) => (
                <div key={test._id} className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-zinc-200 line-clamp-1">{test.name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                      {test.type === 'lab' ? 'Lab Test' : 'Radiology'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong className="text-sm text-zinc-300 font-extrabold">
                      ${test.price.toFixed(2)}
                    </strong>
                    {step === 'details' && (
                      <button
                        onClick={() => removeItem(test._id || '')}
                        className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove test"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Application Block */}
            {step === 'details' && (
              <div className="border-t border-zinc-900 pt-4 space-y-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Promo / Coupon Code
                </span>
                {appliedCoupon ? (
                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs">
                    <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                      <Tag size={12} />
                      <span>{couponCode.toUpperCase()} Applied</span>
                    </span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-zinc-400 hover:text-zinc-100 transition-colors font-bold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. DISCOUNT10"
                      className="flex-1 px-3 py-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-200 text-xs placeholder:text-zinc-600 uppercase focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-emerald-400 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponError && <span className="text-[10px] text-red-400 block">{couponError}</span>}
              </div>
            )}

            {/* Total Details */}
            <div className="border-t border-zinc-900 pt-4 space-y-2.5">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Subtotal</span>
                <span className="text-zinc-300 font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-xs text-zinc-500">
                  <span className="text-emerald-400">Coupon Discount</span>
                  <span className="text-emerald-400 font-semibold">-${discount.toFixed(2)}</span>
                </div>
              )}
              {requestHomeSampling && (
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Home Sampling Collection</span>
                  <span className="text-emerald-400 font-semibold">Included</span>
                </div>
              )}
              {/* Wallet balance row */}
              {!walletLoading && walletBalance > 0 && (
                <div className="flex justify-between text-xs text-zinc-500 border-t border-zinc-900/50 pt-2">
                  <span className="text-teal-600 flex items-center gap-1">
                    <Wallet size={11} />
                    Wallet Credit
                    <span className="text-zinc-600">(bal: ${walletBalance.toFixed(2)})</span>
                  </span>
                  <span className="text-teal-600 font-semibold">-${walletApplied.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900">
                <span className="text-sm font-bold text-zinc-200">You Pay</span>
                <strong className="text-xl font-extrabold text-emerald-400">
                  ${finalTotal.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const Checkout: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout;
