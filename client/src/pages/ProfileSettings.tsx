import React, { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/useAuthStore';
import AppLayout from '../components/layout/AppLayout';
import { User, Lock, Calendar, ChevronsUpDown, Search } from 'lucide-react';
import { authService } from '../services/auth.service';
import { api } from '../services/api';
import { AlertBanner } from '../components/AlertBanner';
import { useToast } from '../components/Toast';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [countryCode, setCountryCode] = useState('+92');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchCountryQuery, setSearchCountryQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const COUNTRIES = [
    { code: '+92', iso: 'pk', name: 'Pakistan' },
    { code: '+1', iso: 'us', name: 'United States' },
    { code: '+998', iso: 'uz', name: 'Uzbekistan' },
    { code: '+93', iso: 'af', name: 'Afghanistan' },
    { code: '+355', iso: 'al', name: 'Albania' },
    { code: '+213', iso: 'dz', name: 'Algeria' },
    { code: '+376', iso: 'ad', name: 'Andorra' },
    { code: '+44', iso: 'gb', name: 'United Kingdom' },
    { code: '+91', iso: 'in', name: 'India' },
    { code: '+61', iso: 'au', name: 'Australia' },
    { code: '+49', iso: 'de', name: 'Germany' },
    { code: '+33', iso: 'fr', name: 'France' },
    { code: '+971', iso: 'ae', name: 'UAE' },
    { code: '+966', iso: 'sa', name: 'Saudi Arabia' },
    { code: '+86', iso: 'cn', name: 'China' },
    { code: '+1', iso: 'ca', name: 'Canada' },
  ];

  const PLACEHOLDERS: Record<string, string> = {
    '+1': '(555) 000-0000',
    '+44': '7700 900077',
    '+91': '98765 43210',
    '+92': '300 1234567',
    '+61': '412 345 678',
    '+49': '170 1234567',
    '+33': '6 12 34 56 78',
    '+971': '50 123 4567',
    '+966': '50 123 4567',
    '+93': '300 1234567',
    '+998': '90 123 4567',
    '+355': '67 123 4567',
    '+213': '5 1234 5678',
    '+376': '123 456',
    '+86': '139 1234 5678',
    '+ca': '(555) 000-0000',
  };

  const EXPECTED_DIGIT_LENGTHS: Record<string, number> = {
    '+1': 10,
    '+44': 10,
    '+91': 10,
    '+92': 10,
    '+61': 9,
    '+49': 10,
    '+33': 9,
    '+971': 9,
    '+966': 9,
    '+93': 9,
    '+998': 9,
    '+355': 9,
    '+213': 9,
    '+376': 6,
    '+86': 11,
  };

  const activeCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchCountryQuery.toLowerCase()) || 
    c.code.includes(searchCountryQuery) ||
    c.iso.toLowerCase().includes(searchCountryQuery.toLowerCase())
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse existing database phone format on load
  useEffect(() => {
    if (user) {
      setName(user.name);
      
      const fullPhone = user.phone || '';
      if (fullPhone) {
        // Sort COUNTRIES by code length descending to match longer dial codes (+971) before shorter ones (+1)
        const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
        const match = sortedCountries.find(c => fullPhone.startsWith(c.code));
        if (match) {
          setCountryCode(match.code);
          setPhoneNumber(fullPhone.substring(match.code.length));
        } else {
          setCountryCode('+92');
          setPhoneNumber(fullPhone);
        }
      } else {
        setCountryCode('+92');
        setPhoneNumber('');
      }
    }
  }, [user]);

  // Security / Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [updatingPw, setUpdatingPw] = useState(false);

  // Google Calendar Integration state (for patients/staff)
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    setProfileError(null);

    // Validate phone input
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      setProfileError('Phone number is required');
      return;
    }

    let digitsOnly = phoneNumber.replace(/\D/g, '');
    // Strip leading 0 if provided (e.g. 03001234567 -> 3001234567)
    if (digitsOnly.startsWith('0')) {
      digitsOnly = digitsOnly.substring(1);
    }
    
    const expectedLength = EXPECTED_DIGIT_LENGTHS[countryCode];
    if (expectedLength) {
      if (digitsOnly.length !== expectedLength) {
        setProfileError(`Phone number for ${activeCountry.name} must be exactly ${expectedLength} digits (e.g. ${PLACEHOLDERS[countryCode]})`);
        return;
      }
    } else {
      if (digitsOnly.length < 7 || digitsOnly.length > 14) {
        setProfileError('Phone number must be between 7 and 14 digits');
        return;
      }
    }

    setUpdatingProfile(true);

    try {
      const combinedPhone = `${countryCode}${digitsOnly}`;
      const res = await api.patch('/users/me/profile', { name, phone: combinedPhone });
      if (res.data?.success) {
        setProfileSuccess(true);
        // Sync updated user state into the global auth store
        useAuthStore.setState({ user: { ...user, name, phone: combinedPhone } as any });
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
      toast.error(err.response?.data?.message || 'Failed to connect Google Calendar.');
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
        toast.success('Google Calendar disconnected successfully.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disconnect Google Calendar.');
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
            <AlertBanner
              variant="success"
              message="Profile details updated successfully!"
              onClose={() => setProfileSuccess(false)}
              className="mb-4"
            />
          )}
          {profileError && (
            <AlertBanner
              variant="error"
              message={profileError}
              onClose={() => setProfileError(null)}
              className="mb-4"
            />
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

              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                
                {/* Combined Input Field Container */}
                <div 
                  className="flex items-center rounded-xl bg-white border border-slate-200 focus-within:border-blue-400 transition-colors relative" 
                  ref={dropdownRef}
                >
                  {/* Dropdown Selector Trigger */}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="pl-3.5 pr-2 py-2.5 flex items-center gap-2 hover:bg-slate-50 transition-colors rounded-l-xl focus:outline-none cursor-pointer shrink-0"
                    disabled={updatingProfile}
                  >
                    <img
                      src={`https://flagcdn.com/w40/${activeCountry.iso}.png`}
                      alt="Flag"
                      className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <span className="font-bold text-xs text-slate-700 tracking-wide uppercase">
                      {activeCountry.iso} {activeCountry.code}
                    </span>
                    <ChevronsUpDown size={14} className="text-slate-400" />
                  </button>

                  {/* Vertical Divider */}
                  <div className="h-6 w-px bg-slate-200 shrink-0"></div>

                  {/* Phone Input Box */}
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={PLACEHOLDERS[countryCode] || '300 1234567'}
                    className="flex-grow bg-transparent pl-3.5 pr-4 py-2.5 text-slate-700 text-sm focus:outline-none placeholder:text-slate-400"
                    disabled={updatingProfile}
                  />

                  {/* Dropdown Panel List */}
                  {dropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col">
                      {/* Search Field */}
                      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/40">
                        <Search size={14} className="text-slate-400" />
                        <input
                          type="text"
                          value={searchCountryQuery}
                          onChange={(e) => setSearchCountryQuery(e.target.value)}
                          placeholder="Search for countries"
                          className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
                        />
                        {searchCountryQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchCountryQuery('')}
                            className="text-slate-400 hover:text-slate-650 p-0.5 cursor-pointer text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Options List */}
                      <div className="max-h-56 overflow-y-auto py-1">
                        {filteredCountries.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 text-center font-semibold">
                            No countries found
                          </div>
                        ) : (
                          filteredCountries.map((c) => (
                            <button
                              key={c.iso}
                              type="button"
                              onClick={() => {
                                setCountryCode(c.code);
                                setDropdownOpen(false);
                                setSearchCountryQuery('');
                              }}
                              className={`w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 text-xs transition-colors cursor-pointer ${
                                c.code === countryCode ? 'bg-blue-50/50 text-blue-600 font-bold' : 'text-slate-600'
                              }`}
                            >
                              <img
                                src={`https://flagcdn.com/w40/${c.iso}.png`}
                                alt={c.name}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <span className="flex-grow font-semibold">{c.name}</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-55 border border-slate-100 text-[10px] text-slate-500 font-black shrink-0">
                                {c.code}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
            <AlertBanner
              variant="success"
              message="Password updated successfully!"
              onClose={() => setPwSuccess(false)}
              className="mb-4"
            />
          )}
          {pwError && (
            <AlertBanner
              variant="error"
              message={pwError}
              onClose={() => setPwError(null)}
              className="mb-4"
            />
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
