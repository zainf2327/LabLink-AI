import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { bookingService } from '../../services/booking.service';
import { walletService } from '../../services/wallet.service';
import { authService } from '../../services/auth.service';
import { reportService } from '../../services/report.service';
import type { Report } from '../../services/report.service';
import type { Booking } from '../../services/booking.service';
import AppLayout from '../../components/layout/AppLayout';
import { ReportDisclosure } from '../../components/ReportDisclosure';
import { buildReportFilename } from '../../utils/reportFilename';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
  X,
  Printer,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'reports'>('bookings');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Secure report viewer states
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [viewingBlobUrl, setViewingBlobUrl] = useState<string | null>(null);
  const [viewingLoading, setViewingLoading] = useState<boolean>(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  // Confirm modal configurations
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false,
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
      isDanger,
    });
  };

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

  // Accessibility and Escape Key logic
  const modalRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!viewingReport) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseViewer();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex="0"], iframe'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Store active element to return focus on close
    const previousActiveElement = document.activeElement as HTMLElement;
    
    // Focus the first element in modal (like the close button or header)
    setTimeout(() => {
      const closeBtn = modalRef.current?.querySelector('.modal-close-btn') as HTMLElement;
      closeBtn?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [viewingReport, viewingBlobUrl]);

  useEffect(() => {
    fetchBookings();
    fetchWallet();
    fetchReports();
  }, []);

  const handleCancelBooking = (bookingId: string, wasPaid: boolean) => {
    triggerConfirm(
      'Cancel Diagnostic Booking',
      'Are you sure you want to cancel this booking? If you have paid, the amount will be fully refunded to your wallet.',
      async () => {
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
      },
      true // isDanger
    );
  };

  const openReportForBooking = (bookingId: string) => {
    const found = reports.find(
      (r) =>
        r.bookingId === bookingId ||
        (typeof r.bookingId === 'object' && (r.bookingId as any)?._id === bookingId)
    );
    if (found) {
      handleViewReport(found);
    } else {
      setActiveTab('reports');
      alert('Report is still loading. Please check the Reports tab.');
    }
  };

  const handleViewReport = async (report: Report) => {
    setViewingReport(report);
    setViewingLoading(true);
    setDownloadProgress(0);
    try {
      // Refresh metadata to get updated accessLog
      const metaRes = await reportService.getReportById(report._id);
      if (metaRes.success && metaRes.data?.report) {
        setViewingReport(metaRes.data.report);
      }

      const blob = await reportService.getReportBlob(report._id, 'view', (percent) => {
        setDownloadProgress(percent);
      });
      const blobUrl = URL.createObjectURL(blob);
      setViewingBlobUrl(blobUrl);
    } catch (err) {
      console.error('View report failed:', err);
      alert('Failed to load report PDF for viewing.');
      setViewingReport(null);
    } finally {
      setViewingLoading(false);
      setDownloadProgress(0);
    }
  };

  const handleCloseViewer = () => {
    if (viewingBlobUrl) {
      URL.revokeObjectURL(viewingBlobUrl);
    }
    setViewingReport(null);
    setViewingBlobUrl(null);
  };

  const handleToggleExpand = async (reportId: string) => {
    const isExpanded = expandedReportId === reportId;
    if (isExpanded) {
      setExpandedReportId(null);
      return;
    }
    setExpandedReportId(reportId);

    const reportObj = reports.find((r) => r._id === reportId);
    if (reportObj && !reportObj.summary) {
      try {
        const res = await reportService.getReportById(reportId);
        if (res.success && res.data?.report) {
          setReports((prev) =>
            prev.map((r) =>
              r._id === reportId ? { ...r, summary: res.data.report.summary } : r
            )
          );
        }
      } catch (err) {
        console.error('Failed to load report summary:', err);
      }
    }
  };

  const handleDownloadReport = async (report: Report) => {
    setDownloadingReportId(report._id);
    setDownloadProgress(0);
    try {
      const blob = await reportService.getReportBlob(report._id, 'download', (percent) => {
        setDownloadProgress(percent);
      });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      const patientName = user?.name || 'Patient';
      let testNames: string[] = [];
      if (report.bookingId && typeof report.bookingId === 'object' && (report.bookingId as any).tests) {
        testNames = (report.bookingId as any).tests.map((t: any) => t.name);
      }
      
      const cleanFileName = buildReportFilename({
        patientName,
        testNames,
        createdAt: report.createdAt,
        versionSuffix: (report as any).versionSuffix,
      }, {
        includePatientName: true,
      });
      
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download report PDF. Please try again.');
    } finally {
      setDownloadingReportId(null);
      setDownloadProgress(0);
    }
  };

  const handlePrintReport = () => {
    const iframe = document.getElementById('secure-report-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      alert('Report viewer is still loading or printing is unsupported in this browser.');
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

  const mockChartData = [
    { date: 'Jan 15', glucose: 98, cholesterol: 185 },
    { date: 'Feb 12', glucose: 104, cholesterol: 178 },
    { date: 'Mar 10', glucose: 95, cholesterol: 190 },
    { date: 'Apr 08', glucose: 92, cholesterol: 182 },
    { date: 'May 05', glucose: 88, cholesterol: 172 },
  ];

  const activeBooking = bookings.find(
    (b) => b.status !== 'completed' && b.status !== 'cancelled'
  );

  const getStepStatus = (currentStatus: string, stepName: string) => {
    const statusOrder = ['pending_payment', 'scheduled', 'sample_collected', 'in_lab', 'report_ready'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepName);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

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
          {/* Active Booking Tracker Stepper */}
          {activeBooking && (
            <div className="glassmorphic-card rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Clock className="text-emerald-400 animate-pulse" size={16} />
                    <span>Active Test Tracker</span>
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Tracking: <strong className="text-zinc-300">{activeBooking.tests.map(t => t.name).join(', ')}</strong>
                  </p>
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {activeBooking.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
                {[
                  { name: 'pending_payment', label: 'Payment' },
                  { name: 'scheduled', label: 'Scheduled' },
                  { name: 'sample_collected', label: 'Sample' },
                  { name: 'in_lab', label: 'In Lab' },
                  { name: 'report_ready', label: 'Ready' }
                ].map((step, index, arr) => {
                  const status = getStepStatus(activeBooking.status, step.name);
                  return (
                    <React.Fragment key={step.name}>
                      <div className="flex items-center gap-3 md:flex-col md:text-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          status === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : status === 'active'
                            ? 'bg-emerald-500/25 border-2 border-emerald-500 text-emerald-400 animate-pulse'
                            : 'bg-zinc-850 border border-zinc-800 text-zinc-500'
                        }`}>
                          {status === 'completed' ? '✓' : index + 1}
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wide block ${
                            status === 'active' ? 'text-emerald-400' : 'text-zinc-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      </div>
                      {index < arr.length - 1 && (
                        <div className={`hidden md:block h-[1px] flex-1 border-t border-dashed transition-all ${
                          status === 'completed' ? 'border-emerald-500' : 'border-zinc-800'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grid Layout: Health Summary Cards + Spline Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Stats cards */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="glassmorphic-card rounded-2xl p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                    <Activity className="text-emerald-400" size={18} />
                    <span>Health Summary</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Upcoming</span>
                        <Calendar className="text-emerald-400" size={14} />
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">{loading ? '…' : upcomingBookingsCount}</p>
                      <span className="text-[9px] text-zinc-500 block mt-1 leading-tight">Scheduled / unpaid</span>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Completed</span>
                        <ClipboardList className="text-emerald-400" size={14} />
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">{loading ? '…' : bookings.filter((b) => b.status === 'completed').length}</p>
                      <span className="text-[9px] text-zinc-500 block mt-1 leading-tight">Diagnostic runs</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl hover:border-emerald-500/40 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Reports</span>
                      <ClipboardList className="text-emerald-400 group-hover:scale-110 transition-transform" size={14} />
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">{reportsLoading ? '…' : reports.length}</p>
                    <span className="text-[9px] text-zinc-500 block mt-1 leading-tight">Click to view</span>
                  </button>
                  <Link to="/patient/wallet" className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl hover:border-teal-500/40 transition-all group block">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Wallet</span>
                      <Wallet className="text-teal-500 group-hover:scale-110 transition-transform" size={14} />
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">${walletBalance.toFixed(2)}</p>
                    <span className="text-[9px] text-zinc-500 block mt-1 leading-tight">Tap for ledger</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right side: Spline Chart */}
            <div className="lg:col-span-2 glassmorphic-card rounded-2xl p-6 flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Patient Health Trends</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Biomarker tracking based on diagnostic report history.</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Glucose
                  </span>
                  <span className="flex items-center gap-1.5 text-teal-400">
                    <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                    Cholesterol
                  </span>
                </div>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCholesterol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                      labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a' }}
                      itemStyle={{ fontSize: '10px', padding: '1px 0' }}
                    />
                    <Area type="monotone" dataKey="glucose" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGlucose)" />
                    <Area type="monotone" dataKey="cholesterol" stroke="#0891b2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCholesterol)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
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
              <div className="space-y-6">
                <div className="glassmorphic-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
                    <FileCheck className="text-emerald-400" size={20} />
                    <span>My Diagnostic Reports</span>
                  </h3>

                  {reportsLoading ? (
                    <div className="py-12 flex justify-center items-center">
                      <Loader size={32} />
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
                                  onClick={() => handleToggleExpand(report._id)}
                                  className="px-3.5 py-1.5 rounded-xl border border-zinc-800 hover:border-purple-500/30 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-purple-400 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>AI Summary</span>
                                  <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                                </button>

                                <button
                                  onClick={() => handleDownloadReport(report)}
                                  disabled={downloadingReportId === report._id}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/5 hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                                >
                                  {downloadingReportId === report._id ? (
                                    <Loader size={14} />
                                  ) : (
                                    <FileDown size={14} />
                                  )}
                                  <span>{downloadingReportId === report._id ? 'Downloading...' : 'Download'}</span>
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <>
                                {!report.summary && !report.vectorized ? (
                                  <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-850/60 animate-pulse space-y-2">
                                    <div className="h-3.5 bg-zinc-800 rounded w-1/4"></div>
                                    <div className="h-3 bg-zinc-900 rounded w-full"></div>
                                    <div className="h-3 bg-zinc-900 rounded w-5/6"></div>
                                    <span className="text-[10px] text-zinc-550 font-medium tracking-wide block pt-1">
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

                {reports.length > 0 && (
                  <ReportDisclosure
                    variant="full"
                    createdAt={reports[0].createdAt}
                    lastViewedAt={reports[0].lastViewedAt}
                    accessLog={reports[0].accessLog}
                  />
                )}
              </div>
            )}
        </div>
      </div>

      {/* Secure Inline Glassmorphic Report Viewer Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in animate-duration-200">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-report-title"
            className="relative w-full max-w-5xl h-[85vh] bg-zinc-950/95 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col glassmorphic-card"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-850 bg-zinc-900/60 backdrop-blur-md">
              <div className="space-y-1">
                <h3 id="modal-report-title" className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <FileCheck size={16} className="text-teal-400 animate-pulse" />
                  <span>{getReportTitle(viewingReport)}</span>
                </h3>
                <p className="text-[10px] text-zinc-550 font-semibold tracking-wider">
                  Secure Report Vault &bull; {new Date(viewingReport.createdAt).toLocaleDateString()} at {new Date(viewingReport.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Print Button */}
                {!viewingLoading && viewingBlobUrl && (
                  <button
                    onClick={handlePrintReport}
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                    title="Print report"
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </button>
                )}

                <button
                  onClick={() => handleDownloadReport(viewingReport)}
                  disabled={downloadingReportId === viewingReport._id}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black disabled:text-zinc-550 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:scale-100 shadow-md shadow-emerald-500/5"
                >
                  {downloadingReportId === viewingReport._id ? (
                    <Loader size={14} />
                  ) : (
                    <FileDown size={14} />
                  )}
                  <span>{downloadingReportId === viewingReport._id ? 'Downloading...' : 'Download PDF'}</span>
                </button>
                <button
                  onClick={handleCloseViewer}
                  aria-label="Close report viewer"
                  className="modal-close-btn p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 bg-zinc-950/40 flex items-center justify-center p-4 relative animate-fade-in animate-duration-300">
              {viewingLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin"></div>
                    <div className="absolute inset-3 rounded-full bg-teal-500/20 blur-sm animate-pulse"></div>
                    {downloadProgress > 0 && (
                      <span className="text-[10px] font-bold text-teal-400 z-10">{downloadProgress}%</span>
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider block animate-pulse animate-duration-1000">
                      Streaming Secure PDF...
                    </span>
                    {downloadProgress > 0 && (
                      <div className="w-48 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="bg-teal-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : viewingBlobUrl ? (
                <iframe
                  id="secure-report-iframe"
                  src={`${viewingBlobUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full rounded-2xl border border-zinc-850/60 bg-zinc-900/20 shadow-inner"
                  title="Secure Report Viewer"
                />
              ) : (
                <div className="text-zinc-500 text-sm">Failed to load report.</div>
              )}
            </div>

            {/* Compact Disclosure Footer */}
            <div className="p-4 border-t border-zinc-850 bg-zinc-900/20">
              <ReportDisclosure
                variant="compact"
                createdAt={viewingReport.createdAt}
                lastViewedAt={viewingReport.lastViewedAt}
                accessLog={viewingReport.accessLog}
              />
            </div>
          </div>
        </div>
      )}
      {/* Reusable Confirm Dialogue Popup */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        isDanger={confirmConfig.isDanger}
      />
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
