import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { bookingService } from '../../services/booking.service';
import { walletService } from '../../services/wallet.service';

import { reportService } from '../../services/report.service';
import type { Report } from '../../services/report.service';
import type { Booking } from '../../services/booking.service';
import AppLayout from '../../components/layout/AppLayout';
import { ReportDisclosure } from '../../components/ReportDisclosure';
import { buildReportFilename } from '../../utils/reportFilename';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../components/Toast';
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
  Sparkles,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Bot,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const highlightBookingId = searchParams.get('bookingId');
  const highlightReportId = searchParams.get('reportId');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'reports'>(
    tabParam === 'reports' ? 'reports' : 'bookings'
  );
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === 'reports') {
      setActiveTab('reports');
    } else if (tabParam === 'bookings') {
      setActiveTab('bookings');
    }
  }, [tabParam]);

  // Handle Google Calendar connection success/error toasts
  const toastShownRef = React.useRef(false);
  useEffect(() => {
    if (toastShownRef.current) return;
    const calendarStatus = searchParams.get('calendar');
    const errorStatus = searchParams.get('error');
    if (calendarStatus === 'connected') {
      toastShownRef.current = true;
      toast.success('Google Calendar connected successfully.');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('calendar');
      setSearchParams(newParams, { replace: true });
    } else if (errorStatus) {
      toastShownRef.current = true;
      toast.error(decodeURIComponent(errorStatus).replace(/_/g, ' '));
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  // Scroll to highlighted booking card
  useEffect(() => {
    if (highlightBookingId && !loading && bookings.length > 0) {
      const element = document.getElementById(`booking-${highlightBookingId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }
    }
  }, [highlightBookingId, loading, bookings]);

  // Scroll to and expand highlighted report card
  useEffect(() => {
    if (highlightReportId && reports.length > 0) {
      const matchedReport = reports.find(
        (r) =>
          r._id === highlightReportId ||
          (r.bookingId &&
            (typeof r.bookingId === 'string'
              ? r.bookingId === highlightReportId
              : (r.bookingId as any)._id === highlightReportId))
      );
      if (matchedReport) {
        setExpandedReportId(matchedReport._id);
        const bookingIdStr = matchedReport.bookingId && (typeof matchedReport.bookingId === 'string' ? matchedReport.bookingId : (matchedReport.bookingId as any)._id);
        const elementId = bookingIdStr ? `report-${bookingIdStr}` : `report-${matchedReport._id}`;
        setTimeout(() => {
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 450);
      }
    }
  }, [highlightReportId, reports]);

  // Secure report viewer states
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [viewingBlobUrl, setViewingBlobUrl] = useState<string | null>(null);
  const [viewingLoading, setViewingLoading] = useState<boolean>(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);





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
    confirm({
      title: 'Cancel Diagnostic Booking',
      message: 'Are you sure you want to cancel this booking? If you have paid, the amount will be fully refunded to your wallet.',
      variant: 'danger',
      onConfirm: async () => {
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
          console.error(err);
        }
      },
    });
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
      toast.warning('Report is still loading. Please check the Reports tab.');
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
      toast.error('Failed to load report PDF for viewing.');
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
      toast.error('Failed to download report PDF. Please try again.');
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
      toast.warning('Report viewer is still loading or printing is unsupported in this browser.');
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
      case 'pending_manual_assignment':
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
        return <Clock className="text-slate-500" size={16} />;
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
      case 'pending_manual_assignment':
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
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-slate-500 text-[10px] font-extrabold uppercase border border-zinc-700 flex items-center gap-1.5">
            <span>{status}</span>
          </span>
        );
    }
  };

  const upcomingBookingsCount = bookings.filter(
    (b) => b.status === 'scheduled' || b.status === 'pending_payment' || b.status === 'pending_manual_assignment'
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
    const normalizedStatus = currentStatus === 'pending_manual_assignment' ? 'scheduled' : currentStatus;
    const currentIndex = statusOrder.indexOf(normalizedStatus);
    const stepIndex = statusOrder.indexOf(stepName);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  const stepIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    pending_payment: CreditCard,
    scheduled: Calendar,
    sample_collected: FlaskConical,
    in_lab: Activity,
    report_ready: FileCheck,
  };


  return (
    <AppLayout pageTitle="Dashboard">
      <div className="p-6 space-y-6">
        {/* Cancel Refund Toast */}
        {cancelMessage && (
          <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl text-cyan-700 text-sm flex items-center gap-3 shadow-sm animate-fadeIn">
            <Wallet size={18} className="shrink-0 text-brand-500" />
            <span className="font-semibold">{cancelMessage}</span>
            <Link to="/patient/wallet" className="ml-auto text-xs font-bold text-brand-600 hover:text-brand-700 underline underline-offset-2 whitespace-nowrap">
              View Wallet
            </Link>
          </div>
        )}
        <div className="space-y-6">

          {/* Stats Row */}
          {/* Active Booking Tracker Stepper */}
          {activeBooking && (
            <div className="glassmorphic-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="text-brand-500 animate-pulse" size={16} />
                    <span>Active Test Tracker</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Tracking: <strong className="text-slate-700">{activeBooking.tests.map(t => t.name).join(', ')}</strong>
                  </p>
                </div>
                {activeBooking.status === 'pending_payment' ? (
                  <Link
                    to={`/checkout?bookingId=${activeBooking._id}`}
                    className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-455 text-black text-[10px] font-black transition-all shadow-md shadow-emerald-500/10 hover:scale-[1.02] flex items-center gap-1 cursor-pointer"
                  >
                    <CreditCard size={12} />
                    <span>Pay Now</span>
                  </Link>
                ) : (
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-brand-50 text-brand-500 border border-brand-100 px-2.5 py-0.5 rounded-full">
                    {(activeBooking.status === 'pending_manual_assignment' ? 'scheduled' : activeBooking.status).replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                {[
                  { name: 'pending_payment', label: 'Payment' },
                  { name: 'scheduled', label: 'Scheduled' },
                  { name: 'sample_collected', label: 'Sample' },
                  { name: 'in_lab', label: 'In Lab' },
                  { name: 'report_ready', label: 'Ready' }
                ].map((step, index, arr) => {
                  const status = getStepStatus(activeBooking.status, step.name);
                  const StepIcon = stepIcons[step.name];
                  return (
                    <React.Fragment key={step.name}>
                      <div className="flex items-center gap-3 md:flex-col md:text-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          status === 'completed'
                            ? 'bg-gradient-to-br from-brand-500 to-accent-400 text-white shadow-lg shadow-brand-500/25 scale-105'
                            : status === 'active'
                            ? 'bg-brand-50 border-2 border-brand-500 text-brand-500 animate-pulse shadow-md shadow-brand-500/15 ring-4 ring-brand-500/10 scale-110'
                            : 'bg-slate-50 border border-slate-200/80 text-slate-400'
                        }`}>
                          <StepIcon size={16} />
                        </div>
                        <div className="md:mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest block leading-none ${
                            status === 'active' ? 'text-brand-500 font-black animate-pulse' : status === 'completed' ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      </div>
                      {index < arr.length - 1 && (
                        <div className="hidden md:block flex-1 h-1.5 bg-slate-100 rounded-full relative overflow-hidden min-w-[30px] mx-2">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-500 to-accent-400 rounded-full transition-all duration-750 ease-out"
                            style={{
                              width: status === 'completed' ? '100%' : '0%',
                            }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ask LabLink AI Card */}
          <div className="glassmorphic-card rounded-2xl p-5 border border-zinc-800 bg-white shadow-sm hover:shadow-md hover:scale-[1.002] transition-all duration-300 relative overflow-hidden group">
            {/* Background glowing effects */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-brand-500/10 transition-colors" />
            <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div className="space-y-1.5 max-w-2xl font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest bg-brand-50 text-brand-600 border border-brand-100 px-2 py-0.5 rounded">
                    Interactive
                  </span>
                  <span className="text-[9px] uppercase font-extrabold tracking-widest bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded">
                    Autonomous
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Bot size={16} className="text-brand-500 shrink-0" />
                  <span>Ask LabLink AI</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Get instant medical report analysis, track biomarkers over time, and ask question prompts based on your processed diagnostic samples.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto flex flex-col items-start sm:items-end gap-1.5">
                <Link
                  to="/patient/ai-assistant"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/10 hover:scale-[1.02] cursor-pointer group"
                >
                  <Sparkles size={12} className="text-white animate-pulse" />
                  <span>Consult AI Assistant</span>
                  <span className="text-[10px] text-brand-100 group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block text-center sm:text-right mt-0.5 leading-none w-full">
                  Interactive AI Actions
                </span>
              </div>
            </div>
          </div>



          {/* Grid Layout: Health Summary Cards + Spline Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Stats cards */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="glassmorphic-card rounded-3xl p-6 flex-1 flex flex-col justify-between group hover:shadow-lg hover:scale-[1.002] transition-all duration-300 relative overflow-hidden">
                {/* Background ambient light score indicator */}
                <div className="absolute left-[-20px] top-[-20px] w-36 h-36 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center gap-4">
                    {/* Glowing Circular Progress Ring */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-[84px] h-[84px] drop-shadow-[0_0_12px_rgba(37,99,235,0.15)]" viewBox="0 0 90 90">
                        <circle
                          cx="45"
                          cy="45"
                          r="36"
                          className="stroke-slate-100"
                          strokeWidth="7"
                          fill="transparent"
                        />
                        <circle
                          cx="45"
                          cy="45"
                          r="36"
                          className="stroke-brand-500 transition-all duration-1000 ease-out"
                          strokeWidth="7"
                          fill="transparent"
                          strokeDasharray="226"
                          strokeDashoffset={reports.length > 0 ? 226 - (226 * 84) / 100 : 226}
                          strokeLinecap="round"
                          transform="rotate(-90 45 45)"
                        />
                        <text x="45" y="42" className="fill-slate-800 font-extrabold text-lg text-center leading-none" textAnchor="middle" dominantBaseline="middle">
                          {reports.length > 0 ? '84' : '--'}
                        </text>
                        <text x="45" y="58" className="fill-slate-400 font-extrabold text-[8px] tracking-widest uppercase text-center leading-none" textAnchor="middle" dominantBaseline="middle">
                          SCORE
                        </text>
                      </svg>
                    </div>

                    <div className="flex-1">
                      <span className="inline-flex items-center px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-brand-50 text-brand-600 border border-brand-100">
                        {reports.length > 0 ? 'Optimal Status' : 'No Data Yet'}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-800 mt-1 tracking-tight">
                        Biomarker Health
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                        {reports.length > 0 
                          ? 'All monitored physiological indicators are stable.' 
                          : 'Complete a diagnostic run to generate health score.'}
                      </p>
                    </div>
                  </div>

                  {/* Horizontal visual timeline divider and clean metrics */}
                  <div className="border-t border-slate-100/80 pt-4 mt-6 flex gap-2 items-center justify-between">
                    {/* Stat 1: Upcoming */}
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-brand-500 mb-1.5 shadow-sm">
                        <Calendar size={14} />
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Upcoming</span>
                      <span className="text-sm font-black text-slate-700 mt-0.5 leading-none block">
                        {loading ? '…' : upcomingBookingsCount}
                      </span>
                    </div>

                    {/* Divider line */}
                    <div className="h-8 w-px bg-slate-200/60" />

                    {/* Stat 2: Reports */}
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="flex-1 flex flex-col items-center text-center group/btn cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1.5 shadow-sm group-hover/btn:bg-emerald-500 group-hover/btn:text-white transition-all duration-200">
                        <ClipboardList size={14} />
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Reports</span>
                      <span className="text-sm font-black text-slate-700 mt-0.5 leading-none block">
                        {reportsLoading ? '…' : reports.length}
                      </span>
                    </button>

                    {/* Divider line */}
                    <div className="h-8 w-px bg-slate-200/60" />

                    {/* Stat 3: Wallet */}
                    <Link
                      to="/patient/wallet"
                      className="flex-1 flex flex-col items-center text-center group/btn cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500 mb-1.5 shadow-sm group-hover/btn:bg-teal-500 group-hover/btn:text-white transition-all duration-200">
                        <Wallet size={14} />
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Balance</span>
                      <span className="text-sm font-black text-slate-700 mt-0.5 leading-none block">
                        ${walletBalance.toFixed(2)}
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Pill Actions bar */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-brand-200 bg-white text-slate-700 hover:text-brand-600 text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm text-center"
                  >
                    View Reports
                  </button>
                  <Link
                    to="/patient/wallet"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all duration-200 text-center shadow-sm"
                  >
                    Wallet Ledger
                  </Link>
                </div>
              </div>
            </div>

            {/* Right side: Spline Chart */}
            <div className="lg:col-span-2 glassmorphic-card rounded-2xl p-6 flex flex-col justify-between gap-4 group hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">Patient Health Trends</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Biomarker tracking based on diagnostic report history.</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-brand-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block shadow-sm" />
                    Glucose
                  </span>
                  <span className="flex items-center gap-1.5 text-teal-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block shadow-sm" />
                    Cholesterol
                  </span>
                </div>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCholesterol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #e2e8f0', 
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px -5px rgba(148, 163, 184, 0.15)'
                      }}
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
            <div className="flex border-b border-slate-200 gap-6 pb-px mb-6">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`pb-3 px-1 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'border-brand-500 text-brand-500 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                My Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`pb-3 px-1 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'reports'
                    ? 'border-brand-500 text-brand-500 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                My Reports ({reports.length})
              </button>
            </div>

            {/* Bookings List */}
            {activeTab === 'bookings' && (
              <div className="glassmorphic-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
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
                  <div className="py-12 text-center text-slate-400 text-sm">
                    You haven't made any bookings yet. Click the button above to book your first test!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking._id}
                        id={`booking-${booking._id}`}
                        className={`border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${
                          highlightBookingId === booking._id
                            ? 'border-brand-500 bg-brand-50/10 shadow-lg shadow-brand-500/5 ring-1 ring-brand-500/25'
                            : 'border-slate-200/60 bg-white/60 hover:bg-white hover:border-brand-200/60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {getStatusIcon(booking.status)}
                            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                              #{booking._id.substring(18).toUpperCase()}
                            </span>
                            <span className="text-sm font-bold text-slate-700">
                              {booking.tests.map((t) => t.name).join(', ')}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
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
                            <div className="text-[11px] text-slate-500 bg-white border border-slate-200 p-3 rounded-xl space-y-1.5 mt-2 max-w-md">
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
                          {(booking.status === 'scheduled' || booking.status === 'pending_manual_assignment') && (
                            <button
                              onClick={() => handleCancelBooking(booking._id, true)}
                              className="px-3.5 py-1.5 rounded-xl border border-zinc-800 hover:border-red-500/20 bg-slate-50 text-xs font-semibold text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          {booking.status === 'pending_payment' && (
                            <Link
                              to={`/checkout?bookingId=${booking._id}`}
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
                <div className="glassmorphic-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileCheck className="text-emerald-400" size={20} />
                    <span>My Diagnostic Reports</span>
                  </h3>

                  {reportsLoading ? (
                    <div className="py-12 flex justify-center items-center">
                      <Loader size={32} />
                    </div>
                  ) : reports.length === 0 ? (
<div className="py-12 text-center text-slate-400 text-sm">
                      No medical reports available yet. Once your samples are processed, your reports will appear here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => {
                        const isExpanded = expandedReportId === report._id;
                        const matchesReport = highlightReportId === report._id || (report.bookingId && (typeof report.bookingId === 'string' ? report.bookingId === highlightReportId : (report.bookingId as any)._id === highlightReportId));
                        const bookingIdStr = report.bookingId && (typeof report.bookingId === 'string' ? report.bookingId : (report.bookingId as any)._id);
                        return (
                          <div
                            key={report._id}
                            id={bookingIdStr ? `report-${bookingIdStr}` : `report-${report._id}`}
                            className={`border p-5 rounded-2xl flex flex-col transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${
                              matchesReport
                                ? 'border-brand-500 bg-brand-50/10 shadow-lg shadow-brand-500/5 ring-1 ring-brand-500/25'
                                : 'border-slate-200/60 bg-white/60 hover:bg-white hover:border-brand-200/60'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <FileCheck className="text-teal-400" size={16} />
                                  {report.bookingId && (
                                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                                      #{typeof report.bookingId === 'string' ? report.bookingId.slice(-6).toUpperCase() : (report.bookingId as any)._id.slice(-6).toUpperCase()}
                                    </span>
                                  )}
                                  <span className="text-sm font-bold text-slate-700">
                                    {getReportTitle(report)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 text-xs text-slate-400">
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
                                   className="px-3.5 py-1.5 rounded-xl border border-zinc-800 hover:border-brand-500/30 hover:bg-brand-50/20 bg-slate-50/50 text-xs font-semibold text-slate-500 hover:text-brand-500 transition-all cursor-pointer flex items-center gap-1.5 group active:scale-98"
                                 >
                                   <Sparkles size={13} className="text-zinc-400 group-hover:text-brand-500 transition-colors" />
                                   <span>AI Summary</span>
                                   {isExpanded ? (
                                     <ChevronUp size={13} className="text-zinc-400 group-hover:text-brand-500 transition-colors" />
                                   ) : (
                                     <ChevronDown size={13} className="text-zinc-400 group-hover:text-brand-500 transition-colors" />
                                   )}
                                 </button>

                                 <button
                                   onClick={() => handleDownloadReport(report)}
                                   disabled={downloadingReportId === report._id}
                                   className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/10 hover:scale-[1.02] active:scale-98 flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                                 >
                                   {downloadingReportId === report._id ? (
                                     <Loader size={13} className="animate-spin" />
                                   ) : (
                                     <FileDown size={13} />
                                   )}
                                   <span>{downloadingReportId === report._id ? 'Downloading...' : 'Download'}</span>
                                 </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 animate-fade-in">
                                {!report.summary && !report.vectorized ? (
                                  <div className="glassmorphic-card rounded-2xl p-5 border border-slate-200/60 animate-pulse space-y-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4.5 h-4.5 rounded-full bg-brand-100 flex items-center justify-center animate-ping"></div>
                                      <div className="h-3.5 bg-slate-200 rounded w-1/3"></div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                      <div className="h-3 bg-slate-100 rounded w-full"></div>
                                      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                                    </div>
                                    <span className="text-[10px] text-brand-500 font-bold tracking-wider block pt-1 animate-pulse">
                                      🧬 Analyzing biomarkers & compiling plain-language summary...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="glassmorphic-card rounded-2xl p-5 border border-slate-200/60 shadow-sm shadow-slate-150/40 space-y-4">
                                      <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-brand-50 text-brand-500">
                                            <Sparkles size={14} className="animate-pulse" />
                                          </div>
                                          <span className="text-xs font-bold text-slate-800 tracking-tight">
                                            AI Plain-Language Summary
                                          </span>
                                        </div>
                                        <span className="text-[9px] uppercase font-extrabold tracking-widest bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full border border-brand-100">
                                          Scoped RAG
                                        </span>
                                      </div>
                                      
                                      {(() => {
                                        if (!report.summary) {
                                          return (
                                            <p className="text-slate-600 text-xs leading-relaxed font-medium whitespace-pre-line px-1">
                                              Summary generation is in progress. Please check back shortly.
                                            </p>
                                          );
                                        }
                                        
                                        const parts = report.summary.split(/\n-+\n|\n\n-+\n/);
                                        const cleanSummary = parts[0]?.trim() || '';
                                        const disclaimer = parts[1]?.trim() || '';
                                        
                                        return (
                                          <div className="space-y-3 px-1">
                                            <p className="text-slate-600 text-xs leading-relaxed font-medium whitespace-pre-line">
                                              {cleanSummary}
                                            </p>
                                            {disclaimer && (
                                              <div className="p-3 rounded-xl bg-zinc-950/40 border border-slate-200/80 text-[10px] text-slate-500 font-semibold leading-relaxed flex items-start gap-2 shadow-inner">
                                                <span className="text-brand-600 shrink-0 font-bold uppercase tracking-widest bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded text-[8px] leading-none">Notice</span>
                                                <span className="flex-1 leading-snug text-slate-500">{disclaimer.replace(/^medical disclaimer:\s*/i, '')}</span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      <div className="pt-2 border-t border-slate-100/60 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                          <Activity size={10} className="text-brand-400" />
                                          Interactive report analysis ready
                                        </span>
                                        <Link
                                          to={`/patient/reports/${report._id}/ai-assistant`}
                                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/10 hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer hover:shadow-lg hover:shadow-brand-500/15"
                                        >
                                          <span>Consult AI Assistant</span>
                                          <Sparkles size={12} className="text-white/80" />
                                        </Link>
                                      </div>
                                    </div>

                                    {/* Dedicated Clinical Security & Audit logs for this specific report */}
                                    <ReportDisclosure
                                      variant="full"
                                      createdAt={report.createdAt}
                                      lastViewedAt={report.lastViewedAt}
                                      accessLog={report.accessLog}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
            className="relative w-full max-w-5xl h-[85vh] bg-slate-50/95 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col glassmorphic-card"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white backdrop-blur-md">
              <div className="space-y-1">
                <h3 id="modal-report-title" className="text-sm font-bold text-slate-800 flex items-center gap-2">
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
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 transition-all text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-1.5"
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
                  className="modal-close-btn p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 transition-all text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 bg-slate-50/40 flex items-center justify-center p-4 relative animate-fade-in animate-duration-300">
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
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block animate-pulse animate-duration-1000">
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
                  className="w-full h-full rounded-2xl border border-slate-200/60 bg-zinc-900/20 shadow-inner"
                  title="Secure Report Viewer"
                />
              ) : (
                <div className="text-slate-400 text-sm">Failed to load report.</div>
              )}
            </div>

            {/* Compact Disclosure Footer */}
            <div className="p-4 border-t border-slate-200 bg-zinc-900/20">
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
