import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../services/subscription.service';
import type { SubscriptionPlan, Subscription } from '../../services/subscription.service';
import { familyService } from '../../services/family.service';
import type { FamilyMember } from '../../services/family.service';
import AppLayout from '../../components/layout/AppLayout';
import { ConfirmModal } from '../../components/ConfirmModal';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Shield,
  Check,
  X,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Heart,
  Smile,
  Lock,
  CreditCard,
  Loader,
  AlertTriangle,
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const MembershipPageContent: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Alert/Message states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formDOB, setFormDOB] = useState('');
  const [formRelationship, setFormRelationship] = useState('spouse');
  const [formGender, setFormGender] = useState<'male' | 'female' | 'other'>('male');

  // Checkout Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeIntentId, setStripeIntentId] = useState<string | null>(null);
  const [stripeAmount, setStripeAmount] = useState(0);
  const [walletAmountUsed, setWalletAmountUsed] = useState(0);
  const [cardName, setCardName] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Family Selection Modal state
  const [isFamilySelectModalOpen, setIsFamilySelectModalOpen] = useState(false);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);

  // Confirm modal configurations
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false,
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
      isDanger,
    });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, subRes, familyRes] = await Promise.all([
        subscriptionService.getAllPlans(),
        subscriptionService.getMySubscription(),
        familyService.getMyFamilyMembers(),
      ]);

      if (plansRes.success) setPlans(plansRes.plans);
      if (subRes.success) {
        setActiveSub(subRes.subscription);
        // Automatically open the selection modal if flagged as needs family selection
        if (subRes.subscription?.needsFamilySelection) {
          setSelectedFamilyIds(subRes.subscription.activeFamilyMemberIds || []);
          setIsFamilySelectModalOpen(true);
        }
      }
      if (familyRes.success) setFamilyMembers(familyRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch membership data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const displaySuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const displayError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const handleSubscribeClick = async (plan: SubscriptionPlan) => {
    setPaymentError(null);
    setCardName('');
    setSelectedPlanForCheckout(plan);
    setSubmitting(true);

    try {
      const res = await subscriptionService.createSubscriptionIntent(plan._id);
      if (res.success) {
        const { clientSecret: secret, stripePaymentIntentId, walletAmountUsed: walletUsed, stripeAmount: amt } = res.data;
        setClientSecret(secret);
        setStripeIntentId(stripePaymentIntentId);
        setWalletAmountUsed(walletUsed);
        setStripeAmount(amt);

        if (!secret || amt === 0) {
          // Zero-price or fully wallet covered bypass
          const confirmRes = await subscriptionService.confirmSubscriptionPayment(stripePaymentIntentId);
          if (confirmRes.success) {
            displaySuccess(confirmRes.message || 'Subscribed successfully!');
            await fetchData();
          }
          setSubmitting(false);
        } else {
          setIsPaymentModalOpen(true);
          setSubmitting(false);
        }
      }
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Failed to initiate purchase intent.');
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!stripe || !elements || !clientSecret || !stripeIntentId) {
      setPaymentError('Stripe has not fully initialized. Please try again.');
      return;
    }

    if (!cardName.trim()) {
      setPaymentError('Cardholder name is required.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Payment card field is missing.');
      return;
    }

    setSubmitting(true);
    try {
      const stripeResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardName,
          },
        },
      });

      if (stripeResult.error) {
        setPaymentError(stripeResult.error.message || 'Payment failed. Please try again.');
        setSubmitting(false);
        return;
      }

      if (stripeResult.paymentIntent && stripeResult.paymentIntent.status === 'succeeded') {
        const confirmRes = await subscriptionService.confirmSubscriptionPayment(stripeIntentId);
        if (confirmRes.success) {
          displaySuccess('Subscription activated successfully!');
          setIsPaymentModalOpen(false);
          await fetchData();
        }
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSub = () => {
    triggerConfirm(
      'Cancel Membership',
      'Are you sure you want to cancel your subscription? Your access will revert to the Free plan immediately.',
      async () => {
        setSubmitting(true);
        try {
          const res = await subscriptionService.cancelMySubscription();
          if (res.success) {
            displaySuccess('Subscription cancelled successfully.');
            await fetchData();
          }
        } catch (err: any) {
          displayError(err.response?.data?.message || 'Failed to cancel subscription.');
        } finally {
          setSubmitting(false);
        }
      },
      true // isDanger
    );
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormDOB('');
    setFormRelationship('spouse');
    setFormGender('male');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setFormName(member.name);
    const dobDate = new Date(member.dateOfBirth);
    const dobString = isNaN(dobDate.getTime()) ? '' : dobDate.toISOString().split('T')[0];
    setFormDOB(dobString);
    setFormRelationship(member.relationship);
    setFormGender(member.gender);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return displayError('Name is required.');
    if (!formDOB) return displayError('Date of Birth is required.');

    setSubmitting(true);
    try {
      if (editingMember) {
        const res = await familyService.updateFamilyMember(editingMember._id, {
          name: formName,
          dateOfBirth: formDOB,
          relationship: formRelationship,
          gender: formGender,
        });
        if (res.success) {
          displaySuccess('Family member updated successfully.');
          setIsModalOpen(false);
          await fetchData();
        }
      } else {
        const res = await familyService.createFamilyMember({
          name: formName,
          dateOfBirth: formDOB,
          relationship: formRelationship,
          gender: formGender,
        });
        if (res.success) {
          displaySuccess('Family member added successfully.');
          setIsModalOpen(false);
          await fetchData();
        }
      }
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Failed to save family member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    triggerConfirm(
      'Remove Family Member',
      'Are you sure you want to remove this family member profile? Any diagnostic records linked to this member will remain, but you will not be able to schedule new tests for them.',
      async () => {
        try {
          const res = await familyService.deleteFamilyMember(memberId);
          if (res.success) {
            displaySuccess('Family member removed successfully.');
            await fetchData();
          }
        } catch (err: any) {
          displayError(err.response?.data?.message || 'Failed to remove family member.');
        }
      },
      true // isDanger
    );
  };

  const handleFamilySelectionCheckbox = (memberId: string) => {
    const limit = activePlanDetails?.maxFamilyMembers || 0;
    if (selectedFamilyIds.includes(memberId)) {
      setSelectedFamilyIds(selectedFamilyIds.filter((id) => id !== memberId));
    } else {
      if (selectedFamilyIds.length >= limit) {
        alert(`You can only select up to ${limit} active family members.`);
        return;
      }
      setSelectedFamilyIds([...selectedFamilyIds, memberId]);
    }
  };

  const submitFamilySelection = async () => {
    setSubmitting(true);
    try {
      const res = await subscriptionService.updateActiveFamilyMembers(selectedFamilyIds);
      if (res.success) {
        displaySuccess('Active family members selection updated.');
        setIsFamilySelectModalOpen(false);
        await fetchData();
      }
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Failed to update active members selection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper values
  const activePlanId = typeof activeSub?.planId === 'object' ? activeSub.planId._id : activeSub?.planId;
  const activePlanDetails = typeof activeSub?.planId === 'object' ? activeSub.planId : (activeSub?.planSnapshot || null);
  const maxFamilyAllowed = activePlanDetails?.maxFamilyMembers || 0;

  // List of active members on current plan
  const activeFamilyMemberIdsList = activeSub?.activeFamilyMemberIds || [];

  if (loading) {
    return (
      <AppLayout pageTitle="Membership & Family">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader className="animate-spin text-emerald-500" size={32} />
          <span className="text-sm font-semibold text-zinc-400">Loading your membership data...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Membership & Family">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="shrink-0" size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="shrink-0" size={18} />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {/* 1. Header Intro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Shield className="text-emerald-400" size={24} />
              <span>Membership & Family Hub</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Configure active family members and manage subscriptions to unlock group diagnostic booking options.
            </p>
          </div>
        </div>

        {/* 2. Active Subscription Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glassmorphic-card rounded-2xl overflow-hidden shadow-xs">
              <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
                <div className="absolute right-4 top-4 opacity-15">
                  <Sparkles size={100} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">Current Status</span>
                    <h2 className="text-lg font-bold">
                      {activePlanDetails?.name ? `${activePlanDetails.name} Plan` : 'Free Tier'}
                    </h2>
                  </div>
                  <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                    {activeSub?.status || 'Active'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-zinc-100">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">Plan Cost</span>
                    <p className="text-2xl font-extrabold text-zinc-100 mt-1">
                      ${activePlanDetails?.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">Expiry Date</span>
                    <p className="text-sm font-semibold text-zinc-100 mt-2 flex items-center gap-1.5">
                      <Calendar size={14} className="text-zinc-500" />
                      {activeSub?.expiryDate ? new Date(activeSub.expiryDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 'Lifetime Access'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">Family Slots</span>
                    <p className="text-sm font-semibold text-zinc-100 mt-2 flex items-center gap-1.5">
                      <Users size={14} className="text-zinc-500" />
                      {activeFamilyMemberIdsList.length} of {maxFamilyAllowed} slots active
                    </p>
                  </div>
                </div>

                {activeSub && activeSub.needsFamilySelection && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="shrink-0" size={16} />
                      <p className="text-xs font-semibold">
                        Your plan requires updating active family members. Some profiles are currently locked.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFamilySelectModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      Resolve Selection
                    </button>
                  </div>
                )}

                {activeSub && !activePlanDetails?.isDefault && activeSub.status === 'active' && (
                  <div className="pt-4 border-t border-zinc-800 flex justify-end">
                    <button
                      onClick={handleCancelSub}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : 'Cancel Membership'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Family Members Management */}
            <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Users size={18} className="text-emerald-400" />
                    <span>Family Members</span>
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {familyMembers.length} profiles linked. {activeFamilyMemberIdsList.length} currently active.
                  </p>
                </div>

                <button
                  onClick={handleOpenAddModal}
                  disabled={familyMembers.length >= maxFamilyAllowed}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  <span>Add Member</span>
                </button>
              </div>

              {familyMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {familyMembers.map((member) => {
                    const isActive = activeFamilyMemberIdsList.includes(member._id);
                    return (
                      <div
                        key={member._id}
                        className={`bg-zinc-900/40 border p-4 rounded-2xl flex items-center justify-between hover:border-emerald-500/20 transition-all ${
                          isActive ? 'border-zinc-800/80' : 'border-red-500/20 bg-red-950/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                              <span>{member.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-850 text-zinc-400 border border-zinc-800 capitalize font-medium">
                                {member.relationship}
                              </span>
                              {!isActive && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 flex items-center gap-0.5 font-bold uppercase tracking-wider">
                                  <Lock size={8} />
                                  <span>Locked</span>
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                              <span>{member.gender}</span>
                              <span className="w-1 h-1 rounded-full bg-zinc-700" />
                              <span>
                                DOB: {new Date(member.dateOfBirth).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(member)}
                            disabled={!isActive}
                            title={isActive ? 'Edit member details' : 'Cannot edit details of a locked member'}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all cursor-pointer disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member._id)}
                            title="Remove member"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800">
                  <div className="w-12 h-12 rounded-full bg-zinc-850 text-zinc-500 flex items-center justify-center mx-auto mb-3">
                    <Users size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-200">No family members registered yet</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Click the button above to add your first family member profile.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar: Feature Summary */}
          <div className="space-y-6">
            <div className="glassmorphic-card rounded-2xl p-6 bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-zinc-800/80">
              <h3 className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5 mb-4">
                <Smile size={16} className="text-emerald-400" />
                <span>Why get membership?</span>
              </h3>
              <ul className="space-y-3.5 text-xs text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>**Priority discounts**: Save up to 15% on diagnostic catalogs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>**Home sample checks**: Completely free home collection sample runs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>**Central health views**: Integrated dashboards containing report indexes for all active members.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Subscription Plan Catalog Selection */}
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Heart size={18} className="text-emerald-400" />
              <span>Available Subscription Plans</span>
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Select or upgrade to the membership tier that fits your family diagnostics requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isActivePlan = activePlanId === plan._id;
              return (
                <div
                  key={plan._id}
                  className={`glassmorphic-card rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                    isActivePlan
                      ? 'border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                      : 'hover:border-zinc-700'
                  }`}
                >
                  {isActivePlan && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest shadow-sm">
                      Current Plan
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{plan.name}</h4>
                      <p className="text-2xl font-extrabold text-zinc-100 mt-2">
                        ${plan.price.toFixed(2)}
                        <span className="text-xs text-zinc-500 font-normal">
                          {plan.durationMonths ? `/${plan.durationMonths}mo` : ' lifetime'}
                        </span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950/40 text-[11px] text-zinc-400 border border-zinc-800">
                      Allows up to <strong className="text-zinc-100">{plan.maxFamilyMembers}</strong> active family members
                    </div>

                    <ul className="space-y-2 text-xs text-zinc-400">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check size={12} className="text-emerald-400 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleSubscribeClick(plan)}
                      disabled={isActivePlan || submitting}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActivePlan
                          ? 'bg-zinc-850 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                      }`}
                    >
                      {isActivePlan ? 'Active' : 'Subscribe Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Family Member Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
                <h3 className="text-sm font-bold text-zinc-100">
                  {editingMember ? 'Edit Family Member' : 'Add Family Member'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={formDOB}
                      onChange={(e) => setFormDOB(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Relationship</label>
                    <select
                      value={formRelationship}
                      onChange={(e) => setFormRelationship(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                    >
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Gender</label>
                  <div className="flex gap-4">
                    {['male', 'female', 'other'].map((genderOption) => (
                      <label key={genderOption} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                        <input
                          type="radio"
                          name="gender"
                          value={genderOption}
                          checked={formGender === genderOption}
                          onChange={() => setFormGender(genderOption as any)}
                          className="accent-emerald-500"
                        />
                        <span className="capitalize">{genderOption}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. Stripe Payment Modal */}
        {isPaymentModalOpen && selectedPlanForCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-zinc-850 flex justify-between items-center bg-zinc-950/40">
                <h3 className="text-sm font-extrabold text-zinc-150 flex items-center gap-2">
                  <CreditCard className="text-emerald-400 animate-pulse" size={16} />
                  <span>Secure Subscription Checkout</span>
                </h3>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
                {paymentError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="shrink-0 mt-0.5" size={14} />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Invoice Breakdown */}
                <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Plan Price</span>
                    <span className="text-zinc-300 font-bold">${selectedPlanForCheckout.price.toFixed(2)}</span>
                  </div>
                  {walletAmountUsed > 0 && (
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Wallet Applied</span>
                      <span className="text-emerald-400 font-bold">-${walletAmountUsed.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-850 pt-2.5 flex justify-between text-xs font-bold text-zinc-200">
                    <span>Total Charged</span>
                    <span className="text-emerald-400 text-sm font-extrabold">${stripeAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Cardholder Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Card Details */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Card details</label>
                    <div className="w-full px-3.5 py-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 text-xs">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              color: '#0f172a',
                              fontFamily: 'Inter, sans-serif',
                              fontSmoothing: 'antialiased',
                              fontSize: '13px',
                              '::placeholder': {
                                color: '#94a3b8',
                              },
                            },
                            invalid: {
                              color: '#ef4444',
                              iconColor: '#ef4444',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-850 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-850 text-zinc-400 hover:bg-zinc-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !stripe}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader className="animate-spin" size={13} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm and Sub</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 7. Family Selection Lock Modal */}
        {isFamilySelectModalOpen && activePlanDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-zinc-850 bg-zinc-950/40">
                <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
                  <Users className="text-amber-400" size={20} />
                  <span>Choose Active Family Profiles</span>
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Your new plan '{activePlanDetails.name}' supports up to <strong>{maxFamilyAllowed}</strong> active profiles. Please select which profiles remain active. Other profiles will be locked.
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {familyMembers.map((member) => {
                    const isChecked = selectedFamilyIds.includes(member._id);
                    return (
                      <label
                        key={member._id}
                        onClick={() => handleFamilySelectionCheckbox(member._id)}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400'
                            : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by click of label container
                            className="accent-emerald-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-zinc-200 block">{member.name}</span>
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">{member.relationship}</span>
                          </div>
                        </div>
                        <span className="text-[10px]">
                          {isChecked ? 'Active' : 'Will Lock'}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 text-center text-xs text-zinc-400">
                  Selected <strong className="text-emerald-400">{selectedFamilyIds.length}</strong> of{' '}
                  <strong className="text-zinc-200">{maxFamilyAllowed}</strong> slots
                </div>

                <div className="pt-4 border-t border-zinc-850 flex justify-end gap-3">
                  <button
                    onClick={submitFamilySelection}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader className="animate-spin" size={14} />
                        <span>Applying Activation Selection...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Selections</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      {/* Reusable Confirm Dialogue Popup */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        isDanger={confirmConfig.isDanger}
      />
    </AppLayout>
  );
};

export const MembershipPage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <MembershipPageContent />
    </Elements>
  );
};
