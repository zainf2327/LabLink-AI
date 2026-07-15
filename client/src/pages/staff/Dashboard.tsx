import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import { LogOut, User, Phone, Mail, Shield, ClipboardList, TrendingUp, Users } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="font-extrabold text-black text-lg">LL</span>
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  LabLink AI
                </span>
                <span className="text-zinc-500 text-xs block -mt-1">Staff Console</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden md:inline">
                Welcome back, <strong className="text-zinc-200">{user?.name}</strong>
              </span>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-blue-400 transition-all duration-200"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 glassmorphic-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
            
            <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-800/80">
              <div className="w-20 h-20 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center mb-4 relative">
                <User size={36} className="text-blue-400" />
                <span className="absolute bottom-0 right-0 bg-blue-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
              <h2 className="text-xl font-bold text-zinc-100">{user?.name}</h2>
              <span className="text-zinc-500 text-sm mt-1">{user?.email}</span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Mail size={16} className="text-zinc-500" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Phone size={16} className="text-zinc-500" />
                <span>{user?.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Shield size={16} className="text-zinc-500" />
                <span className="capitalize">Role: {user?.role}</span>
              </div>
            </div>
          </div>

          {/* Activity / Overview Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glassmorphic-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
                <TrendingUp className="text-blue-400" size={20} />
                <span>Daily Lab Operations</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Assigned Bookings</span>
                    <ClipboardList className="text-blue-400" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">0</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">Pending lab testing</span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Report Approvals</span>
                    <ClipboardList className="text-blue-400" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">0</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">Requires review</span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Patients Served</span>
                    <Users className="text-blue-400" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">0</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">This month</span>
                </div>
              </div>
            </div>

            <div className="glassmorphic-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-zinc-100 mb-4">Staff Desk</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Welcome to your LabLink AI staff workspace. Here you can review test reports, update booking statuses, schedule clinical collection appointments, and consult with the AI co-pilot regarding findings.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
