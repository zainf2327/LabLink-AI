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
  const avatarGradient = ROLE_COLORS[role] ?? ROLE_COLORS.patient;
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

      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 shrink-0">
        <Logo size="sm" />
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
