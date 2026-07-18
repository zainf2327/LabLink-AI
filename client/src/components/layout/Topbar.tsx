import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Lock, Bell, Menu } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

interface TopbarProps {
  pageTitle: string;
  onToggleMobileSidebar?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ pageTitle, onToggleMobileSidebar }) => {
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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
      {/* Left section: Hamburger button for mobile + Page Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
            title="Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div>
          <h1 className="text-lg font-semibold text-slate-800 leading-tight">{pageTitle}</h1>
          <p className="text-xs text-slate-400 leading-none mt-0.5 capitalize">{user?.role} Portal</p>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell (placeholder) */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150">
          <Bell size={18} />
        </button>

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-150 group"
          >
            {/* Avatar circle with initials */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white tracking-wide">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-700 leading-tight truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-slate-400 leading-none capitalize">{user?.role}</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 group-hover:text-blue-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
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
