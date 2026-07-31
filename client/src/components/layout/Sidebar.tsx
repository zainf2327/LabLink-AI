import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Wallet,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  MapPin,
  UserPlus,
  X,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import Logo from '../Logo';

// ─── Nav config per role ─────────────────────────────────────────────────────
const NAV_ITEMS = {
  patient: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/patient/dashboard' },
    { label: 'Book a Test', icon: FlaskConical, to: '/tests' },
    { label: 'Wallet', icon: Wallet, to: '/patient/wallet' },
    { label: 'Membership', icon: Shield, to: '/patient/membership' },
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
    { label: 'Subscriptions', icon: Shield, to: '/admin/subscriptions' },
    { label: 'Regions', icon: MapPin, to: '/admin/regions' },
    { label: 'Staff Management', icon: UserPlus, to: '/admin/staff' },
  ],
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
}

const Sidebar: React.FC<SidebarProps> = ({
  width,
  onWidthChange,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = (user?.role as 'patient' | 'staff' | 'admin') ?? 'patient';
  const navItems = NAV_ITEMS[role] ?? [];
  const badgeColor = ROLE_BADGE_COLORS[role] ?? ROLE_BADGE_COLORS.patient;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';



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
          className={`${role === 'admin' ? 'lg:hidden' : 'md:hidden'} fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity duration-300`}
        />
      )}

      <aside
        style={{ width: mobileOpen ? 'min(80vw, 280px)' : width }}
        className={`fixed top-0 bottom-0 left-0 z-40 ${role === 'admin' ? 'lg:static lg:relative' : 'md:static md:relative'} flex flex-col h-full bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-300 ${role === 'admin' ? 'lg:duration-0' : 'md:duration-0'} ease-in-out shrink-0 select-none ${
          mobileOpen ? 'translate-x-0' : `-translate-x-full ${role === 'admin' ? 'lg:translate-x-0' : 'md:translate-x-0'}`
        }`}
      >
        {/* Resize handle (Desktop only) */}
        <div
          onMouseDown={handleMouseDown}
          className={`${role === 'admin' ? 'hidden lg:block' : 'hidden md:block'} absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/20 active:bg-blue-600 transition-colors z-50`}
        />

      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <span className="font-bold text-slate-800 text-sm tracking-tight leading-tight block">LabLink AI</span>
            <span className="text-[10px] text-slate-400 leading-none capitalize">{role} portal</span>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className={`${role === 'admin' ? 'lg:hidden' : 'md:hidden'} p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer`}
            aria-label="Close navigation drawer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-3">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            onClick={() => {
              if (mobileOpen) {
                onCloseMobile();
              }
            }}
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

      {/* Bottom: User Info + Sign Out */}
      <div className="px-3 pb-4 pt-3 border-t border-slate-200/60 shrink-0 bg-slate-50/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50/40 hover:bg-slate-50/80 border border-slate-200/60 hover:border-slate-200/85 transition-all duration-300 shadow-xs hover:scale-[1.01] group">
          {/* Circular avatar with role-colored border-ring */}
          <div className="relative w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 shadow-inner bg-white border-2 border-slate-100 group-hover:border-brand-500/20 transition-all duration-300">
            <span className="text-[11px] font-extrabold text-slate-700 tracking-wider">
              {initials}
            </span>
            {/* Active Status Dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
            </span>
          </div>

          <div className="flex-1 overflow-hidden min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate" title={user?.name}>
              {user?.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${badgeColor}`}>
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100/50 border border-transparent hover:translate-x-0.5 transition-all duration-200 shrink-0 cursor-pointer"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
};

export default Sidebar;
