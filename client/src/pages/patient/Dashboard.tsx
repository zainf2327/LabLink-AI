import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../../services/booking.service';
import { walletService } from '../../services/wallet.service';
import { authService } from '../../services/auth.service';
import { reportService } from '../../services/report.service';
import type { Report } from '../../services/report.service';
import type { Booking } from '../../services/booking.service';
import AppLayout from '../../components/layout/AppLayout';
import {
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
  FileDown,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'reports'>('bookings');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

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

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await reportService.getMyReports();
      if (res.success && res.data?.reports) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
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
    fetchReports();
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

  const openReportForBooking = (bookingId: string) => {
    const found = reports.find(
      (r) =>
        r.bookingId === bookingId ||
        (typeof r.bookingId === 'object' && (r.bookingId as any)?._id === bookingId)
    );
    if (found && found.fileUrl) {
      window.open(found.fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      setActiveTab('reports');
      alert('Report link is still loading. Please click "Download Report" in the Reports tab.');
    }
  };

  const getReportTitle = (report: any): string => {
    if (report.bookingId && typeof report.bookingId === 'object' && report.bookingId.tests) {
      return report.bookingId.tests.map((t: any) => t.name).join(', ');
    }
    const targetBookingId = typeof report.bookingId === 'object' ? report.bookingId._id : report.bookingId;
    const matchingBooking = bookings.find((b) => b._id === targetBookingId);
    if (matchingBooking && matchingBooking.tests) {
      return matchingBooking.tests.map((t) => t.name).join(', ');
    }
    return `Diagnostic Report (${report._id.substring(18).toUpperCase()})`;
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
    <AppLayout
      pageTitle="Dashboard"
      syncingCalendar={syncingCalendar}
      onConnectCalendar={handleConnectCalendar}
      onDisconnectCalendar={handleDisconnectCalendar}
    >
      <div className="p-6 space-y-6">
        {/* Cancel Refund Toast */}
        {cancelMessage && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-teal-700 text-sm flex items-center gap-3">
            <Wallet size={18} className="shrink-0 text-teal-500" />
            <span>{cancelMessage}</span>
            <Link to="/patient/wallet" className="ml-auto text-xs underline underline-offset-2 hover:text-teal-900 whitespace-nowrap">
              View Wallet
            </Link>
          </div>
        )}

        <div className="space-y-6">

          {/* Stats Row */}
            <div className="glassmorphic-card rounded-2xl p-6">
              <h3 className="text-base font-bold text-zinc-100 mb-5 flex items-center gap-2">
                <Activity className="text-emerald-400" size={18} />
                <span>Health Summary</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Upcoming</span>
                    <Calendar className="text-emerald-400" size={15} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">{loading ? '…' : upcomingBookingsCount}</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">Scheduled / unpaid</span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Completed</span>
                    <ClipboardList className="text-emerald-400" size={15} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">{loading ? '…' : bookings.filter((b) => b.status === 'completed').length}</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">Diagnostic runs</span>
                </div>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl hover:border-emerald-500/40 transition-all text-left cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Reports</span>
                    <ClipboardList className="text-emerald-400 group-hover:scale-110 transition-transform" size={15} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">{reportsLoading ? '…' : reports.length}</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">Click to view</span>
                </button>
                <Link to="/patient/wallet" className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl hover:border-teal-500/40 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Wallet</span>
                    <Wallet className="text-teal-500 group-hover:scale-110 transition-transform" size={15} />
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">${walletBalance.toFixed(2)}</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">Tap for history</span>
                </Link>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-800 gap-6 pb-px mb-6">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`pb-3 px-1 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'border-emerald-500 text-emerald-400 font-black'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                My Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`pb-3 px-1 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'reports'
                    ? 'border-emerald-500 text-emerald-400 font-black'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                My Reports ({reports.length})
              </button>
            </div>

            {/* Bookings List */}
            {activeTab === 'bookings' && (
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
                          {(booking.status === 'report_ready' || booking.status === 'completed') && (
                            <button
                              onClick={() => openReportForBooking(booking._id)}
                              className="px-3.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-black border border-teal-500/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <FileCheck size={12} />
                              <span>View Report</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reports List */}
            {activeTab === 'reports' && (
              <div className="glassmorphic-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
                  <FileCheck className="text-emerald-400" size={20} />
                  <span>My Diagnostic Reports</span>
                </h3>

                {reportsLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader className="animate-spin text-emerald-400" size={32} />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-sm">
                    No medical reports available yet. Once your samples are processed, your reports will appear here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => {
                      const isExpanded = expandedReportId === report._id;
                      return (
                        <div
                          key={report._id}
                          className="border border-zinc-850 bg-zinc-900/30 p-5 rounded-2xl flex flex-col hover:border-zinc-800/80 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <FileCheck className="text-teal-400" size={16} />
                                <span className="text-sm font-bold text-zinc-200">
                                  {getReportTitle(report)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 text-xs text-zinc-500">
                                <span>
                                  Uploaded: {new Date(report.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(report.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span>Format: PDF</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <button
                                onClick={() => setExpandedReportId(isExpanded ? null : report._id)}
                                className="px-3.5 py-1.5 rounded-xl border border-zinc-800 hover:border-purple-500/30 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-purple-400 transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <span>AI Summary</span>
                                <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                              </button>

                              <a
                                href={report.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/5 hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <FileDown size={14} />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>

                          {isExpanded && (
                            <>
                              {!report.summary && !report.vectorized ? (
                                <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-850/60 animate-pulse space-y-2">
                                  <div className="h-3.5 bg-zinc-800 rounded w-1/4"></div>
                                  <div className="h-3 bg-zinc-900 rounded w-full"></div>
                                  <div className="h-3 bg-zinc-900 rounded w-5/6"></div>
                                  <span className="text-[10px] text-zinc-500 font-medium tracking-wide block pt-1">
                                    🧬 AI Summary generating, please wait...
                                  </span>
                                </div>
                              ) : (
                                <div className="mt-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-850/60 space-y-3">
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">
                                      AI Plain-Language Summary
                                    </span>
                                    <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-line">
                                      {report.summary || 'Summary generation in progress...'}
                                    </p>
                                  </div>
                                  <div className="pt-1 flex gap-2">
                                    <Link
                                      to={`/patient/reports/${report._id}/ai-assistant`}
                                      className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500 border border-purple-500/20 text-purple-400 hover:text-black text-xs font-bold transition-all shadow-md shadow-purple-500/5 hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Activity size={12} />
                                      <span>🧬 Ask AI about this report</span>
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </AppLayout>
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
