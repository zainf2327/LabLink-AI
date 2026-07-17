import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { bookingService } from '../../services/booking.service';
import { walletService } from '../../services/wallet.service';
import { authService } from '../../services/auth.service';
import type { Booking } from '../../services/booking.service';
import {
  LogOut,
  User,
  Phone,
  Mail,
  Shield,
  Calendar,
  Activity,
  ClipboardList,
  Home,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  FileCheck,
  Wallet,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const handleConnectCalendar = async () => {
    setSyncingCalendar(true);
    try {
      const res = await authService.getGoogleCalendarConnectUrl();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        alert('Failed to get connection URL.');
      }
    } catch (err: any) {
      console.error('Calendar sync error:', err);
      alert(err.response?.data?.message || 'Failed to connect Google Calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar?')) return;
    setSyncingCalendar(true);
    try {
      const res = await authService.disconnectGoogleCalendar();
      if (res.success) {
        alert('Google Calendar disconnected successfully.');
        // Reload page to re-trigger getMe and update UI status
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disconnect Google Calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getMyBookings(1, 20);
      if (res.success && res.data?.bookings) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await walletService.getWalletBalance();
      if (res.success) setWalletBalance(res.data.walletBalance);
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchWallet();
  }, []);

  const handleCancelBooking = async (bookingId: string, wasPaid: boolean) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await bookingService.cancelBooking(bookingId);
      if (res.success) {
        if (wasPaid) {
          const refundedAmount = res.data.booking.finalAmount;
          setCancelMessage(`Booking cancelled. $${refundedAmount.toFixed(2)} has been credited to your wallet.`);
          fetchWallet(); // refresh wallet balance
          setTimeout(() => setCancelMessage(null), 6000);
        }
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="text-amber-400" size={16} />;
      case 'scheduled':
        return <Calendar className="text-emerald-400" size={16} />;
      case 'sample_collected':
        return <FlaskConical className="text-blue-400" size={16} />;
      case 'in_lab':
        return <Activity className="text-purple-400" size={16} />;
      case 'report_ready':
        return <FileCheck className="text-teal-400" size={16} />;
      case 'completed':
        return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'cancelled':
        return <XCircle className="text-red-400" size={16} />;
      default:
        return <Clock className="text-zinc-400" size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase border border-amber-500/20 flex items-center gap-1.5">
            <Clock size={10} />
            <span>Unpaid</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase border border-emerald-500/20 flex items-center gap-1.5">
            <Calendar size={10} />
            <span>Scheduled</span>
          </span>
        );
      case 'sample_collected':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-extrabold uppercase border border-blue-500/20 flex items-center gap-1.5">
            <FlaskConical size={10} />
            <span>Sample Collected</span>
          </span>
        );
      case 'in_lab':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-extrabold uppercase border border-purple-500/20 flex items-center gap-1.5">
            <Activity size={10} />
            <span>In Lab</span>
          </span>
        );
      case 'report_ready':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-extrabold uppercase border border-teal-500/20 flex items-center gap-1.5">
            <FileCheck size={10} />
            <span>Report Ready</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold uppercase border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 size={10} />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-extrabold uppercase border border-red-500/20 flex items-center gap-1.5">
            <XCircle size={10} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-extrabold uppercase border border-zinc-700 flex items-center gap-1.5">
            <span>{status}</span>
          </span>
        );
    }
  };

  const upcomingBookingsCount = bookings.filter(
    (b) => b.status === 'scheduled' || b.status === 'pending_payment'
  ).length;

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="font-extrabold text-black text-lg">LL</span>
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  LabLink AI
                </span>
                <span className="text-zinc-500 text-xs block -mt-1">Patient Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden md:inline">
                Welcome back, <strong className="text-zinc-200">{user?.name}</strong>
              </span>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-emerald-400 transition-all duration-200"
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

        {/* Cancel Refund Toast */}
        {cancelMessage && (
          <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-teal-600 text-sm flex items-center gap-3 animate-fadeIn">
            <Wallet size={18} className="shrink-0 text-teal-500" />
            <span>{cancelMessage}</span>
            <Link to="/patient/wallet" className="ml-auto text-xs underline underline-offset-2 hover:text-teal-700 whitespace-nowrap">
              View Wallet
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 glassmorphic-card rounded-2xl p-6 relative overflow-hidden group self-start">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>

            <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-800/80">
              <div className="w-20 h-20 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center mb-4 relative">
                <User size={36} className="text-emerald-400" />
                <span className="absolute bottom-0 right-0 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
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

            {/* Google Calendar Section */}
            <div className="mt-6 pt-6 border-t border-zinc-800/80">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <Calendar size={14} className="text-emerald-400" />
                <span>Google Integration</span>
              </h4>
              
              {user?.googleCalendarConnected ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-1">
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping animate-duration-1000"></span>
                      Calendar Synced
                    </span>
                    <span className="text-xs text-zinc-300 truncate">{user.googleEmail}</span>
                  </div>
                  <button
                    onClick={handleDisconnectCalendar}
                    disabled={syncingCalendar}
                    className="w-full py-2 rounded-lg border border-red-900/20 hover:border-red-900/40 bg-red-950/10 hover:bg-red-950/20 text-xs font-semibold text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    Disconnect Google Calendar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Link your Google Calendar to automatically receive calendar events for your scheduled lab test appointments.
                  </p>
                  <button
                    onClick={handleConnectCalendar}
                    disabled={syncingCalendar}
                    className="w-full py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-emerald-400 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>Connect Google Calendar</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity / Overview Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glassmorphic-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
                <Activity className="text-emerald-400" size={20} />
                <span>Quick Health Summary</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      Upcoming Bookings
                    </span>
                    <Calendar className="text-emerald-400" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {loading ? '...' : upcomingBookingsCount}
                  </p>
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    Scheduled or unpaid bookings
                  </span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      Completed tests
                    </span>
                    <ClipboardList className="text-emerald-400" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {loading ? '...' : bookings.filter((b) => b.status === 'completed').length}
                  </p>
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    Completed diagnostic runs
                  </span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      Active Reports
                    </span>
                    <ClipboardList className="text-emerald-400" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {loading ? '...' : bookings.filter((b) => b.status === 'report_ready').length}
                  </p>
                  <span className="text-[10px] text-zinc-500 block mt-1">Reports ready to view</span>
                </div>
                {/* Wallet Balance Card */}
                <Link
                  to="/patient/wallet"
                  className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl hover:border-teal-500/40 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      Wallet Balance
                    </span>
                    <Wallet className="text-teal-500 group-hover:scale-110 transition-transform" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">
                    ${walletBalance.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-zinc-500 block mt-1">Tap to view history</span>
                </Link>
              </div>
            </div>

            {/* Bookings List */}
            <div className="glassmorphic-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center justify-between">
                <span>My Diagnostic Bookings</span>
                <Link
                  to="/tests"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/5 hover:scale-[1.02]"
                >
                  Book New Test
                </Link>
              </h3>

              {loading ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader className="animate-spin text-emerald-400" size={32} />
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  You haven't made any bookings yet. Click the button above to book your first test!
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="border border-zinc-850 bg-zinc-900/30 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(booking.status)}
                          <span className="text-sm font-bold text-zinc-200">
                            {booking.tests.map((t) => t.name).join(', ')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                          <span>
                            Date: {new Date(booking.createdAt).toLocaleDateString()} at{' '}
                            {new Date(booking.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>Total: ${booking.finalAmount.toFixed(2)}</span>
                          {booking.forMemberId && (
                            <span className="text-teal-400 font-medium">Family Booking</span>
                          )}
                        </div>

                        {booking.homeSampling?.requested && (
                          <div className="text-[11px] text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl space-y-1.5 mt-2 max-w-md">
                            <span className="font-semibold text-emerald-400 flex items-center gap-1">
                              <Home size={12} />
                              <span>Home Sampling details</span>
                            </span>
                            <p>Address: {booking.homeSampling.address}</p>
                            <p>
                              Time Slot:{' '}
                              {booking.homeSampling.scheduledAt
                                ? new Date(booking.homeSampling.scheduledAt).toLocaleString()
                                : 'Not selected'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {getStatusBadge(booking.status)}
                        {booking.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id, true)}
                            className="px-3.5 py-1.5 rounded-xl border border-zinc-800 hover:border-red-500/20 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        {booking.status === 'pending_payment' && (
                          <Link
                            to="/checkout"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 text-xs font-semibold transition-all"
                          >
                            Pay Now
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Simple Loader Component helper
const Loader: React.FC<{ className?: string; size?: number }> = ({ className, size = 20 }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={size}
    height={size}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default PatientDashboard;
