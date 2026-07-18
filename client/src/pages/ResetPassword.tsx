import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Invalid reset token. Please request a new link.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword({ token, password });
      if (res.success) {
        setSuccess('Password reset successfully! Redirecting you to login...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 hover:scale-105 transition-transform duration-300">
            <ShieldCheck size={28} className="text-black" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium">
            Choose a strong new password for your account.
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

          {!token ? (
            <div className="text-center space-y-4">
              <p className="text-zinc-400 text-sm">
                No password reset token was found in the URL. Please verify the link in your email or generate a new request.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold py-3 px-4 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                Go to Forgot Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 relative">
                <label htmlFor="password" className="text-sm font-semibold text-zinc-300 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glassmorphic-input w-full pl-10 pr-10 py-3 text-zinc-100 rounded-xl focus:outline-none transition-all duration-300"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-zinc-300 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glassmorphic-input w-full pl-10 pr-10 py-3 text-zinc-100 rounded-xl focus:outline-none transition-all duration-300"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-zinc-700 disabled:to-zinc-800 text-black font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Resetting Password...</span>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-center text-sm">
            <button
              onClick={() => navigate('/login')}
              className="text-zinc-400 hover:text-zinc-300 font-semibold transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
