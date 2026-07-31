import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Lock, Bell, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import Logo from '../Logo';

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
          <p className="text-xs text-slate-400 leading-none mt-0.5 capitalize md:block hidden">{user?.role} Portal</p>
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
            className="flex items-center gap-2.5 p-1.5 md:pl-2 md:pr-3 md:py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-150 group h-11 w-11 md:h-auto md:w-auto justify-center cursor-pointer shrink-0"
            aria-label="User profile options"
          >
            {/* Avatar circle with initials */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-xs font-bold text-white tracking-wide">{initials}</span>
            </div>
            <div className="md:block hidden text-left">
              <p className="text-sm font-semibold text-slate-700 leading-tight truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-slate-400 leading-none capitalize">{user?.role}</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 group-hover:text-blue-500 transition-transform duration-200 md:block hidden ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden z-50 animate-fadeIn">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-sm font-bold text-white">{initials}</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
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
