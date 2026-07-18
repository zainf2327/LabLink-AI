import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Wallet,
  ClipboardList,
  Settings,
  ChevronDown,
  ChevronUp,
  Calendar,
  Lock,
  AlertCircle,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';

// ─── Nav config per role ─────────────────────────────────────────────────────
const NAV_ITEMS = {
  patient: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/patient/dashboard' },
    { label: 'Book a Test', icon: FlaskConical, to: '/tests' },
    { label: 'Wallet', icon: Wallet, to: '/patient/wallet' },
  ],
  staff: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/staff/dashboard' },
    { label: 'Bookings Queue', icon: ClipboardList, to: '/staff/queue' },
  ],
  admin: [
    { label: 'Overview', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Bookings', icon: ClipboardList, to: '/admin/bookings' },
    { label: 'Test Catalog', icon: FlaskConical, to: '/admin/tests' },
    { label: 'Test Categories', icon: Settings, to: '/admin/categories' },
  ],
};

// ─── Role color config ────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  patient: 'from-blue-500 to-blue-700',
  staff: 'from-teal-500 to-cyan-700',
  admin: 'from-violet-500 to-purple-700',
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  patient: 'bg-blue-50 text-blue-600 border-blue-100',
  staff: 'bg-teal-50 text-teal-600 border-teal-100',
  admin: 'bg-violet-50 text-violet-600 border-violet-100',
};

// ─── Sidebar Component ────────────────────────────────────────────────────────
interface SidebarProps {
  width: number;
  onWidthChange: (w: number) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  syncingCalendar?: boolean;
  onConnectCalendar?: () => void;
  onDisconnectCalendar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  width,
  onWidthChange,
  mobileOpen,
  onCloseMobile,
  syncingCalendar = false,
  onConnectCalendar,
  onDisconnectCalendar,
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = (user?.role as 'patient' | 'staff' | 'admin') ?? 'patient';
  const navItems = NAV_ITEMS[role] ?? [];
  const avatarGradient = ROLE_COLORS[role] ?? ROLE_COLORS.patient;
  const badgeColor = ROLE_BADGE_COLORS[role] ?? ROLE_BADGE_COLORS.patient;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Profile & Security expandable panel
  const [profileOpen, setProfileOpen] = useState(false);

  // Set password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [setPwError, setSetPwError] = useState<string | null>(null);
  const [setPwSuccess, setSetPwSuccess] = useState(false);

  // Drag-to-resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentWidth = startWidth + (moveEvent.clientX - startX);
      const newWidth = Math.max(180, Math.min(380, currentWidth));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetPwError(null);
    setSetPwSuccess(false);
    if (newPassword.length < 6) { setSetPwError('Min 6 characters required.'); return; }
    if (newPassword !== confirmPassword) { setSetPwError('Passwords do not match.'); return; }
    setIsSettingPassword(true);
    try {
      const res = await authService.setPassword({ password: newPassword });
      if (res.success) {
        setSetPwSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        useAuthStore.setState({ user: { ...user, hasPassword: true } as any });
      }
    } catch (err: any) {
      setSetPwError(err.response?.data?.message || 'Failed. Please try again.');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity duration-300"
        />
      )}

      <aside
        style={{ width: mobileOpen ? 240 : width }}
        className={`fixed top-0 bottom-0 left-0 z-40 md:static flex flex-col h-full bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-300 md:duration-0 ease-in-out shrink-0 relative select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Resize handle (Desktop only) */}
        <div
          onMouseDown={handleMouseDown}
          className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/20 active:bg-blue-600 transition-colors z-50"
        />

      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 shrink-0">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-sm`}>
          <span className="font-extrabold text-white text-sm">LL</span>
        </div>
        <div>
          <span className="font-bold text-slate-800 text-sm tracking-tight leading-tight block">LabLink AI</span>
          <span className="text-[10px] text-slate-400 leading-none capitalize">{role} portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-3">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                }`}>
                  <item.icon size={15} />
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Security Collapsible (patient only) */}
      {role === 'patient' && (
        <div className="px-3 pb-3 border-t border-slate-100 pt-3">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
              <Settings size={15} />
            </div>
            <span>Profile & Security</span>
            {!user?.hasPassword && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
            <div className="ml-auto text-slate-400">
              {profileOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {profileOpen && (
            <div className="mt-2 px-3 pb-2 space-y-4 animate-fadeIn">
              {/* Google Calendar */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <Calendar size={10} />
                  Google Calendar
                </p>
                {user?.googleCalendarConnected ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Synced
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.googleEmail}</p>
                    </div>
                    <button
                      onClick={onDisconnectCalendar}
                      disabled={syncingCalendar}
                      className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg border border-red-100 transition-all disabled:opacity-50"
                    >
                      Disconnect Calendar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sync appointments to your Google Calendar automatically.
                    </p>
                    <button
                      onClick={onConnectCalendar}
                      disabled={syncingCalendar}
                      className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 rounded-lg border border-blue-100 transition-all disabled:opacity-50 font-medium"
                    >
                      {syncingCalendar ? 'Connecting…' : 'Connect Google Calendar'}
                    </button>
                  </div>
                )}
              </div>

              {/* Set Password (Google users only) */}
              {!user?.hasPassword && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                    <Lock size={10} />
                    Set Password
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    You signed in via Google. Set a password to also log in with email.
                  </p>
                  {setPwError && (
                    <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-100 text-red-500 text-xs flex gap-1.5 items-center">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{setPwError}</span>
                    </div>
                  )}
                  {setPwSuccess && (
                    <div className="mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs flex gap-1.5 items-center">
                      <CheckCircle2 size={12} className="shrink-0" />
                      <span>Password set successfully!</span>
                    </div>
                  )}
                  <form onSubmit={handleSetPassword} className="space-y-2">
                    <input
                      type="password"
                      placeholder="New password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSettingPassword}
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {isSettingPassword ? 'Saving…' : 'Set Password'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom: User Info + Sign Out */}
      <div className="px-3 pb-4 pt-3 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradient} flex items-center justify-center shrink-0 shadow-sm`}>
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${badgeColor}`}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
};

export default Sidebar;
