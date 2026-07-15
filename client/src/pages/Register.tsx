import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Mail, Lock, User, Phone, ShieldPlus, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  }>({});

  const validate = () => {
    const errors: { name?: string; email?: string; password?: string; phone?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
      errors.name = 'Full name is required';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (name.length > 50) {
      errors.name = 'Name must not exceed 50 characters';
    }

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

    // Phone is optional, but if provided let's do a simple check
    if (phone && phone.trim().length < 5) {
      errors.phone = 'Please enter a valid phone number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.register({
        name,
        email,
        password,
        phone: phone.trim() || undefined,
      });

      if (response.success) {
        setSuccess('Registration successful! Redirecting you to login...');
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to the server. Please verify that the backend server is running on port 5001.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 group hover:scale-105 transition-transform duration-300">
            <Sparkles size={28} className="text-black animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
            Create Patient Account
          </h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium">
            Sign up to book clinical tests and review lab results
          </p>
        </div>

        {/* Card */}
        <div className="glassmorphic-card neon-border-glow rounded-3xl p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent rounded-t-3xl"></div>
          
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <ShieldPlus size={22} className="text-emerald-400" />
            <span>Register patient profile</span>
          </h2>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <User size={18} />
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.name && (
                <span className="text-xs text-red-400 mt-1 block font-medium">
                  {validationErrors.name}
                </span>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
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
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.email && (
                <span className="text-xs text-red-400 mt-1 block font-medium">
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Phone size={18} />
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.phone && (
                <span className="text-xs text-red-400 mt-1 block font-medium">
                  {validationErrors.phone}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.password && (
                <span className="text-xs text-red-400 mt-1 block font-medium">
                  {validationErrors.password}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full py-3 mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          {/* Redirection Link */}
          <div className="mt-6 text-center">
            <span className="text-zinc-500 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 decoration-emerald-500/30 transition-colors"
              >
                Sign in
              </Link>
            </span>
          </div>
        </div>

        {/* Footer Medical Disclaimer */}
        <div className="mt-8 text-center text-[10px] text-zinc-600 px-6 max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
          By registering, you acknowledge that AI diagnostics do not substitute direct physician counsel.
        </div>
      </div>
    </div>
  );
};

export default Register;
