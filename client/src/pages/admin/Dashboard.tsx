import React, { useState, useEffect, useCallback } from 'react';
import { catalogService } from '../../services/catalog.service';
import type { Category, Test } from '../../services/catalog.service';
import { analyticsService } from '../../services/analytics.service';
import { bookingService } from '../../services/booking.service';
import type { Booking } from '../../services/booking.service';
import { authService } from '../../services/auth.service';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import {
  ShieldCheck,
  Settings,
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  ShieldX,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  Search,
  UserPlus,
  Loader,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  FlaskConical,
  Activity,
  FileCheck,
  XCircle,
  TrendingUp
} from 'lucide-react';

export const AdminDashboard: React.FC<{ defaultTab?: 'overview' | 'bookings' | 'tests' | 'categories' }> = ({
  defaultTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'tests' | 'categories'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // API States
  const [categories, setCategories] = useState<Category[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [testsCount, setTestsCount] = useState(0);
  const [testPage, setTestPage] = useState(1);
  const [testPages, setTestPages] = useState(1);

  // Loading & Alert States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals / Forms States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testForm, setTestForm] = useState({
    name: '',
    description: '',
    type: 'lab' as 'lab' | 'radiology',
    categoryId: '',
    price: 0,
    preparationInstructions: '',
    duration: '24 hours',
    isHomeCollectionAvailable: false,
    isActive: true,
  });

  // Analytics States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [bookingsTrends, setBookingsTrends] = useState<any[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  const [topTests, setTopTests] = useState<any[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<string>('30days');

  // Bookings Queue States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingPages, setBookingPages] = useState(1);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('all');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');

  // Staff Assignment State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Display Alerts
  const displaySuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const displayError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await catalogService.getCategories();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch Tests
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.getTests({
        page: testPage,
        limit: 8,
      });
      if (res.success) {
        setTests(res.tests);
        setTestsCount(res.total);
        setTestPages(res.pages);
      }
    } catch (err: any) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  }, [testPage]);

  // Fetch Analytics data
  const fetchAnalytics = async () => {
    try {
      let startDateStr = '';
      const now = new Date();
      if (dateRangePreset === '7days') {
        const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        startDateStr = d.toISOString().split('T')[0];
      } else if (dateRangePreset === '30days') {
        const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        startDateStr = d.toISOString().split('T')[0];
      } else if (dateRangePreset === 'thismonth') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        startDateStr = d.toISOString().split('T')[0];
      }

      const endDateStr = now.toISOString().split('T')[0];

      const [overviewRes, bookingsRes, revenueRes, topTestsRes] = await Promise.all([
        analyticsService.getOverview({ startDate: startDateStr, endDate: endDateStr }),
        analyticsService.getBookingsTrends({ startDate: startDateStr, endDate: endDateStr }),
        analyticsService.getRevenueTrends({ startDate: startDateStr, endDate: endDateStr }),
        analyticsService.getTopTests(),
      ]);

      if (overviewRes.success) setOverviewData(overviewRes.data);
      if (bookingsRes.success) setBookingsTrends(bookingsRes.data.trends || []);
      if (revenueRes.success) setRevenueTrends(revenueRes.data.trends || []);
      if (topTestsRes.success) setTopTests(topTestsRes.data.topTests || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Fetch Bookings Queue
  const fetchBookingsQueue = async () => {
    setBookingsLoading(true);
    try {
      const params: any = {
        page: bookingPage,
        limit: 5,
        status: bookingStatusFilter || undefined,
        type: bookingTypeFilter || undefined,
        date: bookingDateFilter === 'today' ? 'today' : undefined,
        search: bookingSearchQuery.trim() || undefined,
      };

      const res = await bookingService.getAllBookings(params);
      if (res.success && res.data) {
        setBookings(res.data.bookings || []);
        if (res.data.pagination) {
          setBookingPages(Math.ceil(res.data.pagination.total / res.data.pagination.limit) || 1);
          setBookingsCount(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching bookings queue:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Fetch staff dropdown list
  const fetchStaffList = async () => {
    try {
      const res = await authService.getStaffUsers();
      if (res.success && res.data?.staff) {
        setStaffList(res.data.staff);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };

  // Load initial catalog data
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (activeTab === 'tests') {
      fetchTests();
    } else if (activeTab === 'overview') {
      fetchAnalytics();
    } else if (activeTab === 'bookings') {
      fetchBookingsQueue();
      fetchStaffList();
    }
  }, [activeTab, testPage, dateRangePreset, bookingPage, bookingStatusFilter, bookingTypeFilter, bookingDateFilter, bookingSearchQuery, fetchTests]);

  // Create or Update Category
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      displayError('Category name is required');
      return;
    }

    try {
      if (editingCategory && editingCategory._id) {
        await catalogService.updateCategory(editingCategory._id, {
          name: categoryName,
          description: categoryDesc,
        });
        displaySuccess('Category updated successfully');
      } else {
        await catalogService.createCategory({
          name: categoryName,
          description: categoryDesc,
        });
        displaySuccess('Category created successfully');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryName('');
      setCategoryDesc('');
      fetchCategories();
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Error saving category');
    }
  };

  // Delete Category
  const handleCategoryDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await catalogService.deleteCategory(id);
      if (res.success) {
        displaySuccess('Category deleted successfully');
        fetchCategories();
      }
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Cannot delete category: tests are still associated with it');
    }
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setIsCategoryModalOpen(true);
  };

  // Create or Update Test
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.name.trim() || !testForm.description.trim() || !testForm.categoryId || testForm.price < 0) {
      displayError('Please fill out all required fields with valid values');
      return;
    }

    try {
      if (editingTest && editingTest._id) {
        await catalogService.updateTest(editingTest._id, testForm);
        displaySuccess('Test updated successfully');
      } else {
        await catalogService.createTest(testForm);
        displaySuccess('Test created successfully');
      }
      setIsTestModalOpen(false);
      setEditingTest(null);
      fetchTests();
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Error saving test');
    }
  };

  // Soft Deactivate Test
  const handleTestDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this test? It will be hidden from public catalog.')) return;
    try {
      await catalogService.deactivateTest(id);
      displaySuccess('Test deactivated successfully');
      fetchTests();
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Error deactivating test');
    }
  };

  const openEditTest = (test: Test) => {
    setEditingTest(test);
    setTestForm({
      name: test.name,
      description: test.description,
      type: test.type,
      categoryId: typeof test.categoryId === 'object' ? test.categoryId._id : test.categoryId,
      price: test.price,
      preparationInstructions: test.preparationInstructions || '',
      duration: test.duration,
      isHomeCollectionAvailable: test.isHomeCollectionAvailable,
      isActive: test.isActive !== false,
    });
    setIsTestModalOpen(true);
  };

  const openAddTest = () => {
    setEditingTest(null);
    setTestForm({
      name: '',
      description: '',
      type: 'lab',
      categoryId: categories[0]?._id || '',
      price: 0,
      preparationInstructions: '',
      duration: '24 hours',
      isHomeCollectionAvailable: false,
      isActive: true,
    });
    setIsTestModalOpen(true);
  };

  // Staff Assignment handles
  const handleAssignStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningBookingId) return;

    setActionLoading(assigningBookingId);
    try {
      const res = await bookingService.assignStaff(assigningBookingId, selectedStaffId || null);
      if (res.success) {
        setAssigningBookingId(null);
        setSelectedStaffId('');
        displaySuccess('Staff assigned and calendar events synchronized successfully');
        fetchBookingsQueue();
      }
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Failed to assign staff.');
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
        displaySuccess('Booking cancelled and calendar entries removed successfully');
        fetchBookingsQueue();
      }
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Failed to cancel booking.');
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
            <CheckCircle size={10} />
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

  return (
    <AppLayout pageTitle="Admin Dashboard">
      {/* Alert Banners */}
      {success && (
        <div className="fixed top-20 right-8 z-50 max-w-sm w-full bg-zinc-900/90 border border-emerald-500/30 backdrop-blur p-4 rounded-xl shadow-2xl flex gap-3 items-center animate-fadeIn">
          <CheckCircle className="text-emerald-400 shrink-0" size={20} />
          <span className="text-sm font-semibold text-emerald-300">{success}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-8 z-50 max-w-sm w-full bg-zinc-900/90 border border-red-500/30 backdrop-blur p-4 rounded-xl shadow-2xl flex gap-3 items-center animate-fadeIn">
          <AlertTriangle className="text-red-400 shrink-0" size={20} />
          <span className="text-sm font-semibold text-red-300">{error}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6 flex flex-col gap-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-850 gap-2 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck size={18} />
            <span>Console Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'bookings'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ClipboardList size={18} />
            <span>Bookings & Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'tests'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid size={18} />
            <span>Test Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'categories'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings size={18} />
            <span>Test Categories</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-8">
            
            {/* Analytics Tab (Feature 11) */}
            {activeTab === 'overview' && (
              <>
                {/* Numeric Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glassmorphic-card p-4 rounded-xl relative overflow-hidden">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block mb-1">
                      Total Bookings
                    </span>
                    <p className="text-2xl font-bold text-zinc-100">{overviewData?.totalBookings || 0}</p>
                    <span className="text-[10px] text-zinc-500 block mt-1">Paid bookings in range</span>
                  </div>

                  <div className="glassmorphic-card p-4 rounded-xl relative overflow-hidden">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block mb-1">
                      Total Revenue
                    </span>
                    <p className="text-2xl font-bold text-emerald-400">${(overviewData?.totalRevenue || 0).toFixed(2)}</p>
                    <span className="text-[10px] text-zinc-500 block mt-1">Gross sales turnover</span>
                  </div>

                  <div className="glassmorphic-card p-4 rounded-xl relative overflow-hidden">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block mb-1">
                      New Patients
                    </span>
                    <p className="text-2xl font-bold text-purple-400">{overviewData?.newPatientsCount || 0}</p>
                    <span className="text-[10px] text-zinc-500 block mt-1">User registrations</span>
                  </div>
                </div>

                {/* Date preset selector */}
                <div className="flex items-center justify-between bg-zinc-900/30 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Analytics Date Range</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDateRangePreset('7days')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dateRangePreset === '7days' ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => setDateRangePreset('30days')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dateRangePreset === '30days' ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => setDateRangePreset('thismonth')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dateRangePreset === 'thismonth' ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      This Month
                    </button>
                  </div>
                </div>

                {/* Recharts Area / Bar charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bookings Trend */}
                  <div className="glassmorphic-card p-5 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} className="text-purple-400" />
                      <span>Bookings Over Time</span>
                    </h4>
                    <div className="h-64 w-full">
                      {bookingsTrends.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-500 text-xs">No trend data available</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={bookingsTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                            <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 12, color: '#f4f4f5' }} />
                            <Area type="monotone" dataKey="bookings" stroke="#a855f7" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Revenue Trend */}
                  <div className="glassmorphic-card p-5 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <span>Revenue Growth ($)</span>
                    </h4>
                    <div className="h-64 w-full">
                      {revenueTrends.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-500 text-xs">No trend data available</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                            <YAxis stroke="#71717a" fontSize={10} />
                            <Tooltip formatter={(value) => `$${value}`} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 12, color: '#f4f4f5' }} />
                            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Tests sales table/charts */}
                <div className="glassmorphic-card p-5 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical size={14} className="text-purple-400" />
                    <span>Top Booked Diagnostic Tests</span>
                  </h4>
                  {topTests.length === 0 ? (
                    <p className="text-zinc-500 text-xs py-4 text-center">No catalog sales logged yet.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {topTests.map((t, idx) => (
                        <div key={t.testId} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-300">{idx + 1}. {t.name}</span>
                            <span className="text-purple-400">{t.bookingsCount} orders</span>
                          </div>
                          {/* Percentage bar display */}
                          <div className="w-full bg-zinc-900 border border-zinc-850 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                              style={{ width: `${Math.min((t.bookingsCount / (topTests[0]?.bookingsCount || 1)) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Bookings Queue Console Tab (Admin Control) */}
            {activeTab === 'bookings' && (
              <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                
                {/* Bookings Queue filters row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/60">
                  {/* Search Bar */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      value={bookingSearchQuery}
                      onChange={(e) => setBookingSearchQuery(e.target.value)}
                      placeholder="Search Patient..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs placeholder:text-zinc-650 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-450 text-xs focus:outline-none cursor-pointer"
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
                      value={bookingTypeFilter}
                      onChange={(e) => setBookingTypeFilter(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-450 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">All Methods</option>
                      <option value="home">Home Sampling</option>
                      <option value="lab">In-Lab Visit</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <select
                      value={bookingDateFilter}
                      onChange={(e) => setBookingDateFilter(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-450 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today's Appointments</option>
                    </select>
                  </div>
                </div>

                {/* Queue display */}
                {bookingsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader className="animate-spin text-purple-400" size={28} />
                    <span className="text-zinc-550 text-xs font-semibold uppercase">Fetching Bookings...</span>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800/80 rounded-2xl bg-zinc-900/10">
                    <ClipboardList className="text-zinc-700 mb-3" size={32} />
                    <p className="text-zinc-450 text-xs font-semibold uppercase tracking-wider">No Bookings Found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/50 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
                      >
                        {/* Info details */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-zinc-400">{booking._id.substring(18).toUpperCase()}</span>
                            {getStatusBadge(booking.status)}
                            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-450 text-[9px] uppercase font-bold border border-zinc-700/60">
                              {booking.homeSampling.requested ? 'Home sampling' : 'In-lab visit'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-zinc-200">
                            {booking.patientId && (booking.patientId as any).name}
                            {booking.forMemberId && <span className="text-zinc-550 font-normal text-xs ml-1">(for Family Member)</span>}
                          </h4>

                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <Calendar size={12} className="shrink-0" />
                            <span>{booking.homeSampling.scheduledAt ? new Date(booking.homeSampling.scheduledAt).toLocaleString() : 'No date set'}</span>
                          </div>

                          {/* Tests list */}
                          <div className="text-[11px] text-zinc-450 flex flex-wrap gap-1.5 items-center">
                            <span className="text-zinc-600 uppercase font-extrabold tracking-wide">Tests:</span>
                            {booking.tests.map((t) => (
                              <span key={t.testId} className="px-1.5 py-0.5 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded">
                                {t.name}
                              </span>
                            ))}
                          </div>

                          {/* Home Collection address */}
                          {booking.homeSampling.requested && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-1">
                              <MapPin size={12} className="text-purple-500 shrink-0" />
                              <span className="truncate">{booking.homeSampling.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Actions: Staff dropdown and cancellation */}
                        <div className="flex sm:flex-col items-start sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
                          
                          {booking.homeSampling.requested && (
                            <div className="w-full sm:w-auto">
                              {assigningBookingId === booking._id ? (
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
                                    className="p-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer animate-pulse-subtle"
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
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 transition-all cursor-pointer"
                                >
                                  <UserPlus size={12} />
                                  <span>
                                    {booking.homeSampling.assignedStaffId
                                      ? `Agent: ${(booking.homeSampling.assignedStaffId as any).name || 'Assigned'}`
                                      : 'Assign Staff'}
                                  </span>
                                </button>
                              )}
                            </div>
                          )}

                          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              disabled={actionLoading === booking._id}
                              className="px-3.5 py-1.5 rounded-lg border border-red-900/20 hover:border-red-900/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {bookingPages > 1 && (
                  <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-2">
                    <button
                      onClick={() => setBookingPage((prev) => Math.max(prev - 1, 1))}
                      disabled={bookingPage === 1 || bookingsLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <span className="text-zinc-550 text-xs font-extrabold uppercase">
                      Page {bookingPage} of {bookingPages} (Total {bookingsCount})
                    </span>
                    <button
                      onClick={() => setBookingPage((prev) => Math.min(prev + 1, bookingPages))}
                      disabled={bookingPage === bookingPages || bookingsLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Test Catalog Tab */}
            {activeTab === 'tests' && (
              <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-wide">Diagnostic Test Catalog</h3>
                  <button
                    onClick={openAddTest}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add New Test</span>
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-purple-500/20 border-t-purple-450 animate-spin"></div>
                  </div>
                ) : tests.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-sm">
                    No tests in the catalog database yet. Click "Add New Test" to begin.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-450 text-xs uppercase tracking-wider font-semibold">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tests.map((test) => (
                          <tr key={test._id} className="border-b border-zinc-850/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-zinc-200">{test.name}</td>
                            <td className="py-3.5 px-4 capitalize text-zinc-400 text-xs">{test.type}</td>
                            <td className="py-3.5 px-4 text-zinc-450 text-xs">
                              {typeof test.categoryId === 'object' ? test.categoryId.name : 'Unknown'}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-400">${test.price.toFixed(2)}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                test.isActive !== false
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {test.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1 shrink-0">
                              <button
                                onClick={() => openEditTest(test)}
                                className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              {test.isActive !== false && (
                                <button
                                  onClick={() => handleTestDeactivate(test._id || '')}
                                  className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900/40 bg-zinc-900 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Deactivate"
                                >
                                  <ShieldX size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {testPages > 1 && (
                  <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-4">
                    <span className="text-xs text-zinc-500">
                      Total <strong className="text-zinc-300">{testsCount}</strong> tests
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTestPage((p) => Math.max(p - 1, 1))}
                        disabled={testPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900 text-xs font-semibold text-zinc-400 disabled:opacity-40 cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setTestPage((p) => Math.min(p + 1, testPages))}
                        disabled={testPage === testPages}
                        className="px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900 text-xs font-semibold text-zinc-400 disabled:opacity-40 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Test Categories Tab */}
            {activeTab === 'categories' && (
              <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-wide">Diagnostic Categories</h3>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryName('');
                      setCategoryDesc('');
                      setIsCategoryModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Create Category</span>
                  </button>
                </div>

                {categories.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-sm">
                    No diagnostic categories found in the database.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat._id}
                        className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700/80 flex items-start justify-between gap-4 transition-all"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-zinc-200 text-sm truncate">{cat.name}</h4>
                          <p className="text-xs text-zinc-550 mt-1 line-clamp-2 leading-relaxed">
                            {cat.description || 'No description provided'}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => openEditCategory(cat)}
                            className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleCategoryDelete(cat._id || '')}
                            className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900/40 bg-zinc-900 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
             )}
           </div>

      {/* Category Creation / Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glassmorphic-card rounded-3xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 font-sans">
              {editingCategory ? 'Edit Category' : 'Create Diagnostic Category'}
            </h3>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Hematology, Biochemistry"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="Brief summary of tests included in this category"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 min-h-24 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Creation / Edit Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg glassmorphic-card rounded-3xl p-6 relative my-8">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 font-sans">
              {editingTest ? 'Edit Diagnostic Test' : 'Add Test to Catalog'}
            </h3>

            <form onSubmit={handleTestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Test Name
                  </label>
                  <input
                    type="text"
                    value={testForm.name}
                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                    placeholder="e.g. Complete Blood Count"
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Diagnostic Category
                  </label>
                  <select
                    value={testForm.categoryId}
                    onChange={(e) => setTestForm({ ...testForm, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-400 text-sm focus:outline-none bg-zinc-950 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  placeholder="What is this test measuring and what is its medical function?"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 min-h-20 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Test Type
                  </label>
                  <select
                    value={testForm.type}
                    onChange={(e) => setTestForm({ ...testForm, type: e.target.value as 'lab' | 'radiology' })}
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-400 text-sm focus:outline-none bg-zinc-950 cursor-pointer"
                    required
                  >
                    <option value="lab">Lab Test</option>
                    <option value="radiology">Radiology Scan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={testForm.price}
                    onChange={(e) => setTestForm({ ...testForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="50"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Duration (Turnaround)
                  </label>
                  <input
                    type="text"
                    value={testForm.duration}
                    onChange={(e) => setTestForm({ ...testForm, duration: e.target.value })}
                    placeholder="e.g. 24 hours, 3 days"
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Preparation Instructions
                </label>
                <input
                  type="text"
                  value={testForm.preparationInstructions}
                  onChange={(e) => setTestForm({ ...testForm, preparationInstructions: e.target.value })}
                  placeholder="e.g. Fasting for 12 hours required before blood draw"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-655 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testForm.isHomeCollectionAvailable}
                    onChange={(e) => setTestForm({ ...testForm, isHomeCollectionAvailable: e.target.checked })}
                    className="rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Home sampling available</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testForm.isActive}
                    onChange={(e) => setTestForm({ ...testForm, isActive: e.target.checked })}
                    className="rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Active in Catalog</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestModalOpen(false);
                    setEditingTest(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {editingTest ? 'Save Changes' : 'Add Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
