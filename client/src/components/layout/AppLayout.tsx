import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FlaskConical, Wallet, Shield, ClipboardList } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

interface AppLayoutProps {
  pageTitle: string;
  children: React.ReactNode;
  syncingCalendar?: boolean;
  onConnectCalendar?: () => void;
  onDisconnectCalendar?: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  pageTitle,
  children,
  syncingCalendar,
  onConnectCalendar,
  onDisconnectCalendar,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 240;
  });
  const { user } = useAuthStore();
  const role = (user?.role as 'patient' | 'staff' | 'admin') ?? 'patient';

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  const mobileNavItems = {
    patient: [
      { label: 'Home', icon: LayoutDashboard, to: '/patient/dashboard' },
      { label: 'Tests', icon: FlaskConical, to: '/tests' },
      { label: 'Wallet', icon: Wallet, to: '/patient/wallet' },
      { label: 'Member', icon: Shield, to: '/patient/membership' },
    ],
    staff: [
      { label: 'Home', icon: LayoutDashboard, to: '/staff/dashboard' },
      { label: 'Queue', icon: ClipboardList, to: '/staff/queue' },
    ],
    admin: [
      { label: 'Home', icon: LayoutDashboard, to: '/admin/dashboard' },
      { label: 'Bookings', icon: ClipboardList, to: '/admin/bookings' },
      { label: 'Catalog', icon: FlaskConical, to: '/admin/tests' },
    ],
  };

  const navs = mobileNavItems[role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Sidebar (Desktop only) */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          mobileOpen={false}
          onCloseMobile={() => {}}
          syncingCalendar={syncingCalendar}
          onConnectCalendar={onConnectCalendar}
          onDisconnectCalendar={onDisconnectCalendar}
        />
      </div>

      {/* Right column: topbar + scrollable content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden pb-16 md:pb-0">
        <Topbar
          pageTitle={pageTitle}
          onToggleMobileSidebar={undefined} // Mobile toggle disabled since we use bottom tabs
        />
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      {navs.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 z-40 flex items-center justify-around px-2 shadow-lg shadow-zinc-300/5">
          {navs.map((nav) => (
            <NavLink
              key={nav.to}
              to={nav.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                  isActive ? 'text-emerald-500' : 'text-zinc-400'
                }`
              }
            >
              <nav.icon size={20} />
              <span>{nav.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppLayout;
