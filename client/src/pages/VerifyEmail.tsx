import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { ShieldAlert, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Try to retrieve email from navigation state
  const initialEmail = (location.state as { email?: string })?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Email address is required.');
      return;
    }
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyEmail(email, code);
      if (res.success) {
        setSuccess('Email verified successfully! You will be redirected to the login page shortly.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address to resend the code.');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsResending(true);

    try {
      const res = await authService.resendVerificationCode(email);
      if (res.success) {
        setSuccess(res.message || 'A new verification code has been sent to your email.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to resend verification code. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 hover:scale-105 transition-transform duration-300">
            <ShieldAlert size={28} className="text-black" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
            Verify Your Email
          </h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium">
            Please check your inbox for the 6-digit code.
          </p>
        </div>

        <div className="glassmorphic-card neon-border-glow rounded-3xl p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent rounded-t-3xl"></div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm flex gap-3 items-start animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-sm flex gap-3 items-start">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {!initialEmail && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-zinc-300 block">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glassmorphic-input w-full px-4 py-3 text-zinc-100 rounded-xl focus:outline-none transition-all duration-300"
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-semibold text-zinc-300 block text-center">
                Enter 6-Digit Code
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                required
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="glassmorphic-input w-full px-4 py-3 text-center tracking-[12px] font-mono text-2xl text-zinc-100 rounded-xl focus:outline-none transition-all duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isResending}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-zinc-700 disabled:to-zinc-800 text-black font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="animate-spin text-black" size={20} />
              ) : (
                <>
                  <span>Verify Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-sm">
            <button
              onClick={handleResend}
              disabled={isLoading || isResending}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isResending ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Resending...</span>
                </>
              ) : (
                <span>Resend Code</span>
              )}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-zinc-400 hover:text-zinc-300 font-medium transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
