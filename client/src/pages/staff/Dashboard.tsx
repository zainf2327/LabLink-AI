import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import {
  User,
  ClipboardList,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader,
  UserPlus,
  MapPin,
  FlaskConical,
  Activity,
  FileCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { authService } from '../../services/auth.service';
import { bookingService } from '../../services/booking.service';
import type { Booking } from '../../services/booking.service';
import { reportService } from '../../services/report.service';

export const StaffDashboard: React.FC<{ defaultTab?: 'my_assignments' | 'all_bookings' }> = ({
  defaultTab = 'my_assignments',
}) => {
  const { user } = useAuthStore();
  
  // Google sync states
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  // Bookings and filtering states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs & filters
  const [activeTab, setActiveTab] = useState<'my_assignments' | 'all_bookings'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal / Dropdown state for assigning staff
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch active staff list
  const fetchStaff = async () => {
    try {
      const res = await authService.getStaffUsers();
      if (res.success && res.data?.staff) {
        setStaffList(res.data.staff);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };

  // Fetch bookings based on filters
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 5, // smaller limit for tighter styling
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        date: dateFilter === 'today' ? 'today' : undefined,
        search: searchQuery.trim() || undefined,
      };

      if (activeTab === 'my_assignments' && user) {
        params.assignedStaffId = user.id;
      }

      const res = await bookingService.getAllBookings(params);
      if (res.success && res.data) {
        setBookings(res.data.bookings || []);
        if (res.data.pagination) {
          setTotalPages(Math.ceil(res.data.pagination.total / res.data.pagination.limit) || 1);
        }
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter changes
    fetchBookings();
  }, [activeTab, statusFilter, typeFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchBookings();
  }, [currentPage]);

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
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disconnect Google Calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, nextStatus: string) => {
    setActionLoading(bookingId);
    try {
      const res = await bookingService.updateBookingStatus(bookingId, nextStatus);
      if (res.success) {
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUploadReport = async (bookingId: string, file: File) => {
    if (!file) return;
    setActionLoading(bookingId);
    try {
      const res = await reportService.uploadReport(bookingId, file);
      if (res.success) {
        alert('Report uploaded successfully! Booking status updated to Report Ready.');
        fetchBookings();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to upload report.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(bookingId);
    try {
      const res = await bookingService.cancelBooking(bookingId);
      if (res.success) {
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningBookingId) return;

    setActionLoading(assigningBookingId);
    try {
      const res = await bookingService.assignStaff(assigningBookingId, selectedStaffId || null);
      if (res.success) {
        setAssigningBookingId(null);
        setSelectedStaffId('');
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign staff.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase border border-amber-500/20 flex items-center gap-1">
            <Clock size={10} />
            <span>Unpaid</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase border border-emerald-500/20 flex items-center gap-1">
            <Calendar size={10} />
            <span>Scheduled</span>
          </span>
        );
      case 'sample_collected':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-extrabold uppercase border border-blue-500/20 flex items-center gap-1">
            <FlaskConical size={10} />
            <span>Collected</span>
          </span>
        );
      case 'in_lab':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-extrabold uppercase border border-purple-500/20 flex items-center gap-1">
            <Activity size={10} />
            <span>In Lab</span>
          </span>
        );
      case 'report_ready':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-extrabold uppercase border border-teal-500/20 flex items-center gap-1">
            <FileCheck size={10} />
            <span>Report Ready</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold uppercase border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 size={10} />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-extrabold uppercase border border-red-500/20 flex items-center gap-1">
            <XCircle size={10} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-extrabold uppercase border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  const getNextAction = (booking: Booking) => {
    if (actionLoading === booking._id) {
      return (
        <button disabled className="px-3.5 py-1.5 rounded-lg bg-zinc-800/80 text-zinc-500 text-xs font-semibold flex items-center gap-1.5">
          <Loader size={12} className="animate-spin" />
          <span>Processing...</span>
        </button>
      );
    }

    switch (booking.status) {
      case 'scheduled':
        return (
          <button
            onClick={() => handleUpdateStatus(booking._id, 'sample_collected')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-black text-xs font-extrabold transition-all cursor-pointer transform active:scale-95"
          >
            Collect Sample
          </button>
        );
      case 'sample_collected':
        return (
          <button
            onClick={() => handleUpdateStatus(booking._id, 'in_lab')}
            className="px-3.5 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-black text-xs font-extrabold transition-all cursor-pointer transform active:scale-95"
          >
            Send to Lab
          </button>
        );
      case 'in_lab':
        return (
          <label className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black text-xs font-extrabold transition-all cursor-pointer transform active:scale-95 flex items-center justify-center gap-1">
            <FileCheck size={12} />
            <span>Upload Report</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadReport(booking._id, file);
                }
              }}
            />
          </label>
        );
      case 'report_ready':
        return (
          <button
            onClick={() => handleUpdateStatus(booking._id, 'completed')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all cursor-pointer transform active:scale-95"
          >
            Complete Booking
          </button>
        );
      default:
        return null;
    }
  };

  // Operational metrics
  const homeSamplingCount = bookings.filter((b) => b.homeSampling.requested && b.status !== 'completed' && b.status !== 'cancelled').length;
  const inLabCount = bookings.filter((b) => !b.homeSampling.requested && b.status !== 'completed' && b.status !== 'cancelled').length;
  const totalCompletedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <AppLayout
      pageTitle="Staff Dashboard"
      syncingCalendar={syncingCalendar}
      onConnectCalendar={handleConnectCalendar}
      onDisconnectCalendar={handleDisconnectCalendar}
    >
      <div className="p-6 space-y-6">

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glassmorphic-card p-4 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    My Home Sampling
                  </span>
                  <MapPin className="text-blue-400" size={16} />
                </div>
                <p className="text-2xl font-bold text-zinc-100">{homeSamplingCount}</p>
                <span className="text-[10px] text-zinc-500 block mt-1">Pending collections</span>
              </div>
              
              <div className="glassmorphic-card p-4 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    In-Lab Bookings
                  </span>
                  <FlaskConical className="text-purple-400" size={16} />
                </div>
                <p className="text-2xl font-bold text-zinc-100">{inLabCount}</p>
                <span className="text-[10px] text-zinc-500 block mt-1">Visiting clinic</span>
              </div>

              <div className="glassmorphic-card p-4 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    Total Completed
                  </span>
                  <CheckCircle2 className="text-emerald-500" size={16} />
                </div>
                <p className="text-2xl font-bold text-zinc-100">{totalCompletedCount}</p>
                <span className="text-[10px] text-zinc-500 block mt-1">Reports delivered</span>
              </div>
            </div>

            {/* Bookings Queue Console */}
            <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
              
              {/* Tab Navigation */}
              <div className="flex border-b border-zinc-800 pb-px">
                <button
                  onClick={() => { setActiveTab('my_assignments'); setCurrentPage(1); }}
                  className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === 'my_assignments'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-350'
                  }`}
                >
                  My Assignments
                </button>
                <button
                  onClick={() => { setActiveTab('all_bookings'); setCurrentPage(1); }}
                  className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === 'all_bookings'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-350'
                  }`}
                >
                  All Bookings Queue
                </button>
              </div>

              {/* Filters Header */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/60">
                {/* Search Bar */}
                <div className="relative sm:col-span-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Patient Name..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="sample_collected">Sample Collected</option>
                    <option value="in_lab">In Lab</option>
                    <option value="report_ready">Report Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">All Collection Types</option>
                    <option value="home">Home Sampling</option>
                    <option value="lab">In-Lab Visit</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today's Appointments</option>
                  </select>
                </div>
              </div>

              {/* Bookings Queue */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader className="animate-spin text-blue-400" size={28} />
                  <span className="text-zinc-550 text-xs uppercase font-semibold">Fetching Bookings...</span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800/80 rounded-2xl bg-zinc-900/10">
                  <ClipboardList className="text-zinc-700 mb-3" size={32} />
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">No Bookings Found</p>
                  <p className="text-zinc-600 text-[11px] mt-1">There are no bookings matching the current filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
                    >
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-zinc-400">{booking._id.substring(18).toUpperCase()}</span>
                          {getStatusBadge(booking.status)}
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[9px] uppercase font-extrabold border border-zinc-700/60">
                            {booking.homeSampling.requested ? 'Home sampling' : 'In-lab visit'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-zinc-150">
                          {booking.patientId && (booking.patientId as any).name} 
                          {booking.forMemberId && <span className="text-zinc-500 font-normal text-xs ml-1">(for Family Member)</span>}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <Calendar size={12} className="shrink-0" />
                          <span>{booking.homeSampling.scheduledAt ? new Date(booking.homeSampling.scheduledAt).toLocaleString() : 'No date set'}</span>
                        </div>

                        {/* List of tests */}
                        <div className="text-[11px] text-zinc-400 flex flex-wrap gap-1.5 items-center">
                          <span className="text-zinc-600 uppercase font-extrabold tracking-wide">Tests:</span>
                          {booking.tests.map((t) => (
                            <span key={t.testId} className="px-1.5 py-0.5 bg-zinc-850 border border-zinc-800 text-zinc-350 rounded font-medium">
                              {t.name}
                            </span>
                          ))}
                        </div>

                        {/* Home sampling specific address & notes */}
                        {booking.homeSampling.requested && (
                          <div className="space-y-1 pt-1.5 border-t border-zinc-900/60 mt-1">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                              <MapPin size={12} className="text-blue-500 shrink-0" />
                              <span className="truncate">{booking.homeSampling.address}</span>
                            </div>
                            {booking.notes && (
                              <p className="text-[11px] text-zinc-550 italic leading-relaxed">
                                Notes: "{booking.notes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Assignment & Status Action Buttons */}
                      <div className="flex sm:flex-col items-start sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
                        
                        {/* Google calendar staff assignment */}
                        {booking.homeSampling.requested && (
                          <div className="w-full sm:w-auto">
                            {user?.role === 'admin' ? (
                              assigningBookingId === booking._id ? (
                                <form onSubmit={handleAssignStaffSubmit} className="flex items-center gap-1.5 w-full">
                                  <select
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="py-1 px-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none cursor-pointer"
                                  >
                                    <option value="">Unassign</option>
                                    {staffList.map((st) => (
                                      <option key={st._id} value={st._id}>
                                        {st.name} {st.googleCalendarConnected ? '🔒' : ''}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="submit"
                                    className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-black text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Assign
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAssigningBookingId(null)}
                                    className="p-1.5 rounded bg-zinc-800 text-zinc-400 text-xs transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </form>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAssigningBookingId(booking._id);
                                    setSelectedStaffId(booking.homeSampling.assignedStaffId ? (booking.homeSampling.assignedStaffId as any)._id || booking.homeSampling.assignedStaffId : '');
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-all cursor-pointer"
                                >
                                  <UserPlus size={12} />
                                  <span>
                                    {booking.homeSampling.assignedStaffId
                                      ? `Agent: ${(booking.homeSampling.assignedStaffId as any).name || 'Assigned'}`
                                      : 'Assign Staff'}
                                  </span>
                                </button>
                              )
                            ) : (
                              // Read-only indicator for staff
                              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900/20 text-zinc-500 font-medium">
                                <User size={12} />
                                <span>
                                  {booking.homeSampling.assignedStaffId
                                    ? `Agent: ${(booking.homeSampling.assignedStaffId as any).name || 'Assigned'}`
                                    : 'Unassigned'}
                                </span>
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 w-full sm:w-auto">
                          {/* Contextual Action Button */}
                          {getNextAction(booking)}
                          
                          {/* Cancel Action */}
                          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="px-3.5 py-1.5 rounded-lg border border-red-900/20 hover:border-red-900/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <span className="text-zinc-550 text-xs uppercase font-extrabold tracking-wide">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
      </div>
    </div>
  </AppLayout>
  );
};

export default StaffDashboard;
