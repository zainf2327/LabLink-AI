import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Lock, Bell, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import Logo from '../Logo';

const ROLE_AVATAR_COLORS: Record<string, string> = {
  patient: 'bg-brand-50 text-brand-600 border-brand-200/50',
  staff: 'bg-teal-50 text-teal-600 border-teal-200/50',
  admin: 'bg-purple-50 text-purple-600 border-purple-200/50',
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  patient: 'bg-brand-50 text-brand-600 border-brand-100',
  staff: 'bg-teal-50 text-teal-600 border-teal-100',
  admin: 'bg-purple-50 text-purple-600 border-purple-100',
};

const ROLE_HOVER_STYLES: Record<string, string> = {
  patient: 'hover:border-brand-200/60 hover:bg-brand-50/20',
  staff: 'hover:border-teal-200/60 hover:bg-teal-50/20',
  admin: 'hover:border-purple-200/60 hover:bg-purple-50/20',
};

const ROLE_TEXT_HOVER: Record<string, string> = {
  patient: 'group-hover:text-brand-500',
  staff: 'group-hover:text-teal-500',
  admin: 'group-hover:text-purple-500',
};

interface TopbarProps {
  pageTitle: string;
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ pageTitle, isMobileSidebarOpen, onToggleMobileSidebar }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 sticky top-0 z-40 shrink-0">
      {/* Left section: Hamburger button for mobile + Page Title */}
      <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className={`${user?.role === 'admin' ? 'lg:hidden' : 'md:hidden'} h-11 w-11 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer shrink-0`}
            title={isMobileSidebarOpen ? "Close menu" : "Menu"}
            aria-label={isMobileSidebarOpen ? "Close navigation drawer" : "Toggle navigation drawer"}
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        
        <div className={`${user?.role === 'admin' ? 'lg:hidden' : 'md:hidden'} flex items-center shrink-0 ml-0.5`}>
          <Logo size="sm" />
        </div>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 leading-tight truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">{pageTitle}</h1>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Notification Bell (placeholder) */}
        <button className="relative w-11 h-11 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150 cursor-pointer shrink-0">
          <Bell size={18} />
        </button>

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200/60 transition-all duration-200 group h-10 md:h-auto justify-center cursor-pointer shrink-0 shadow-2xs ${ROLE_HOVER_STYLES[user?.role ?? 'patient']}`}
            aria-label="User profile options"
          >
            {/* Avatar circle with initials */}
            <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-extrabold text-[11px] tracking-wider shadow-inner border ${ROLE_AVATAR_COLORS[user?.role ?? 'patient']}`}>
              {initials}
            </div>
            <div className="md:block hidden text-left max-w-[100px] min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate leading-tight">{user?.name}</p>
            </div>
            <ChevronDown
              size={12}
              className={`text-slate-400 transition-transform duration-200 md:block hidden ${ROLE_TEXT_HOVER[user?.role ?? 'patient']} ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden z-50 animate-fadeIn">
              {/* User info header */}
              <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-inner border font-extrabold text-xs tracking-wider ${ROLE_AVATAR_COLORS[user?.role ?? 'patient']}`}>
                    {initials}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-405 truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-widest border ${ROLE_BADGE_COLORS[user?.role ?? 'patient']}`}>
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1.5">
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-100"
                >
                  <User size={15} className="text-slate-400" />
                  <span>Profile & Account</span>
                </Link>
                {!user?.hasPassword && (
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors duration-100"
                  >
                    <Lock size={15} className="text-amber-400" />
                    <span>Set Password</span>
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  </Link>
                )}
              </div>

              {/* Sign Out */}
              <div className="border-t border-slate-100 py-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-100"
                >
                  <LogOut size={15} className="text-red-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
