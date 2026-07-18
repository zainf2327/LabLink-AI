import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar (handles desktop width and mobile drawer overlay internally) */}
      <Sidebar
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        syncingCalendar={syncingCalendar}
        onConnectCalendar={onConnectCalendar}
        onDisconnectCalendar={onDisconnectCalendar}
      />

      {/* Right column: topbar + scrollable content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          pageTitle={pageTitle}
          onToggleMobileSidebar={() => setMobileOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
