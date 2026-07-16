import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Mail, Lock, Shield, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'staff') navigate('/staff/dashboard', { replace: true });
      else navigate('/patient/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      await login({ email, password });
      // Redirect happens in useEffect
    } catch (err: any) {
      console.error('Login error caught in frontend:', err);
      console.log('err.response is:', err.response);
      console.log('err.response?.data is:', err.response?.data);
      if (!err.response) {
        setError('Cannot connect to the server. Please verify that the backend server is running on port 5001.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 group hover:scale-105 transition-transform duration-300">
            <Sparkles size={28} className="text-black animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
            Welcome to LabLink AI
          </h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium">
            Access secure diagnostic reporting and smart AI analysis
          </p>
        </div>

        {/* Card */}
        <div className="glassmorphic-card neon-border-glow rounded-3xl p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent rounded-t-3xl"></div>
          
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <Shield size={20} className="text-emerald-400" />
            <span>Sign in to account</span>
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm flex gap-3 items-start animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.email && (
                <span className="text-xs text-red-400 mt-1.5 block font-medium">
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {validationErrors.password && (
                <span className="text-xs text-red-400 mt-1.5 block font-medium">
                  {validationErrors.password}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            {/* Google Sign In Button */}
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/auth/google`}
              className="w-full py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-200 font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </a>
          </form>

          {/* Redirection Link */}
          <div className="mt-8 text-center flex flex-col gap-2">
            <span className="text-zinc-500 text-sm">
              Don't have a patient account?{' '}
              <Link
                to="/register"
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 decoration-emerald-500/30 transition-colors"
              >
                Sign up
              </Link>
            </span>
            <span className="text-zinc-650 text-xs mt-1">
              Or{' '}
              <Link
                to="/tests"
                className="text-emerald-450 hover:text-emerald-400 font-bold transition-colors uppercase tracking-wider text-[11px] underline underline-offset-4 decoration-emerald-500/20"
              >
                Browse Test Catalog
              </Link>
            </span>
          </div>
        </div>

        {/* Footer Medical Disclaimer */}
        <div className="mt-8 text-center text-[10px] text-zinc-600 px-6 max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
          Security standard compliant. All AI interpretations require certified clinician sign-off.
        </div>
      </div>
    </div>
  );
};

export default Login;
