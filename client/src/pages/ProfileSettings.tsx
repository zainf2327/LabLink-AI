import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import AppLayout from '../components/layout/AppLayout';
import { User, Lock, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { authService } from '../services/auth.service';
import { api } from '../services/api';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuthStore();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Security / Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [updatingPw, setUpdatingPw] = useState(false);

  // Google Calendar Integration state (for patients/staff)
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    setProfileError(null);
    setUpdatingProfile(true);

    try {
      const res = await api.patch('/users/me/profile', { name, phone });
      if (res.data?.success) {
        setProfileSuccess(true);
        // Sync updated user state into the global auth store
        useAuthStore.setState({ user: { ...user, name, phone } as any });
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(false);
    setPwError(null);

    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    setUpdatingPw(true);
    try {
      const res = await authService.setPassword({ password: newPassword });
      if (res.success) {
        setPwSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        useAuthStore.setState({ user: { ...user, hasPassword: true } as any });
      }
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setUpdatingPw(false);
    }
  };

  const handleConnectCalendar = async () => {
    setSyncingCalendar(true);
    try {
      const res = await authService.getGoogleCalendarConnectUrl();
      if (res.success && res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to connect Google Calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    setSyncingCalendar(true);
    try {
      const res = await authService.disconnectGoogleCalendar();
      if (res.success) {
        useAuthStore.setState({ user: { ...user, googleCalendarConnected: false, googleEmail: undefined } as any });
        alert('Google Calendar disconnected successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disconnect Google Calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  };

  return (
    <AppLayout pageTitle="Profile & Security Settings">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        
        {/* Profile Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <User className="text-blue-500" size={18} />
            <span>Profile Information</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">Update your account name and phone details.</p>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-55 text-emerald-600 border border-emerald-100 text-xs flex gap-2 items-center">
              <CheckCircle2 size={16} />
              <span>Profile details updated successfully!</span>
            </div>
          )}
          {profileError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-500 border border-red-100 text-xs flex gap-2 items-center">
              <AlertCircle size={16} />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:outline-none text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555 1234"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:outline-none text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400 focus:outline-none cursor-not-allowed"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded border">
                  Locked
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {updatingProfile ? 'Saving Changes…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password / Security Settings Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Lock className="text-blue-500" size={18} />
            <span>Security & Password</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            {user?.googleEmail && 'You are signed in via Google OAuth. '}
            {user?.hasPassword
              ? 'Update your current access password.'
              : 'Set a password to also log in with your email address.'}
          </p>

          {pwSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-55 text-emerald-600 border border-emerald-100 text-xs flex gap-2 items-center">
              <CheckCircle2 size={16} />
              <span>Password updated successfully!</span>
            </div>
          )}
          {pwError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-500 border border-red-100 text-xs flex gap-2 items-center">
              <AlertCircle size={16} />
              <span>{pwError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:outline-none text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Verify new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:outline-none text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingPw}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {updatingPw ? 'Saving…' : user?.hasPassword ? 'Update Password' : 'Set Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Google Calendar integration (accessible to patient & staff) */}
        {(user?.role === 'patient' || user?.role === 'staff') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Calendar className="text-blue-500" size={18} />
              <span>Google Calendar Sync</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Link your appointments automatically with your Google Calendar scheduling.
            </p>

            {user?.googleCalendarConnected ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-55 border border-emerald-100">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Calendar Sync Active
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">{user.googleEmail}</p>
                </div>
                <button
                  onClick={handleDisconnectCalendar}
                  disabled={syncingCalendar}
                  className="px-4 py-2 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  Disconnect Calendar
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 max-w-md">
                  Google Calendar is not synced. Connecting it will sync all scheduled diagnostics and home sampling collection appointments to your timeline.
                </p>
                <button
                  onClick={handleConnectCalendar}
                  disabled={syncingCalendar}
                  className="px-5 py-2.5 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {syncingCalendar ? 'Connecting…' : 'Connect Google Calendar'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default ProfileSettings;
