import React, { useState, useEffect, useCallback } from 'react';
import { catalogService } from '../../services/catalog.service';
import { useSearchParams } from 'react-router-dom';
import type { Category, Test } from '../../services/catalog.service';
import { analyticsService } from '../../services/analytics.service';
import { bookingService } from '../../services/booking.service';
import type { Booking } from '../../services/booking.service';
import { authService } from '../../services/auth.service';
import { subscriptionService } from '../../services/subscription.service';
import { regionService } from '../../services/region.service';
import type { Region } from '../../services/region.service';
import { staffService } from '../../services/staff.service';
import type { StaffMember } from '../../services/staff.service';
import { couponService } from '../../services/coupon.service';
import type { Coupon } from '../../services/coupon.service';
import { useConfirm } from '../../hooks/useConfirm';
import { AlertBanner } from '../../components/AlertBanner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import {
  ShieldCheck,
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
  X,
  TrendingUp,
  Key,
  ShieldAlert,
  MoreVertical,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  report_ready: '#06b6d4',
  in_lab: '#8b5cf6',
  sample_collected: '#6366f1',
  scheduled: '#3b82f6',
  pending_payment: '#f59e0b',
  pending_manual_assignment: '#f43f5e',
  cancelled: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-left font-sans">
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color || item.fill }} />
            <span className="text-[11px] font-bold text-slate-600 capitalize">{item.name}:</span>
            <span className="text-[11px] font-extrabold text-slate-800 ml-auto">
              {item.name === 'revenue' ? `$${item.value.toFixed(2)}` : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AdminDashboard: React.FC<{ defaultTab?: 'overview' | 'bookings' | 'tests' | 'categories' | 'subscriptions' | 'regions' | 'staff' | 'coupons' }> = ({
  defaultTab = 'overview',
}) => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const searchParam = searchParams.get('search');

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'tests' | 'categories' | 'subscriptions' | 'regions' | 'staff' | 'coupons'>(
    (tabParam as any) || defaultTab
  );

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam as any);
    } else {
      setActiveTab(defaultTab);
    }
  }, [tabParam, defaultTab]);


  // API States
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderValue: '' as number | '',
    maxUses: '' as number | '',
    expiresAt: '',
    isActive: true,
  });
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
  const [bookingSearchQuery, setBookingSearchQuery] = useState(searchParam || '');

  useEffect(() => {
    if (searchParam) {
      setBookingSearchQuery(searchParam);
    }
  }, [searchParam]);

  // Staff Assignment State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Subscriptions management states
  const [subPlans, setSubPlans] = useState<any[]>([]);
  const [adminSubscriptions, setAdminSubscriptions] = useState<any[]>([]);
  const [adminSubPage, setAdminSubPage] = useState(1);
  const [adminSubPages, setAdminSubPages] = useState(1);
  const [adminSubCount, setAdminSubCount] = useState(0);
  const [adminSubLoading, setAdminSubLoading] = useState(false);

  const [isSubPlanModalOpen, setIsSubPlanModalOpen] = useState(false);
  const [editingSubPlan, setEditingSubPlan] = useState<any | null>(null);
  const [subPlanForm, setSubPlanForm] = useState({
    name: '',
    price: 0,
    maxFamilyMembers: 0,
    features: [''],
  });

  // Regions management states
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsCount, setRegionsCount] = useState(0);
  const [regionPage, setRegionPage] = useState(1);
  const [regionPages, setRegionPages] = useState(1);
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionSearchQuery, setRegionSearchQuery] = useState('');
  const [regionStatusFilter, setRegionStatusFilter] = useState('');

  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region[] | any | null>(null);
  const [regionForm, setRegionForm] = useState({
    city: '',
    name: '',
    country: 'Pakistan',
    isActive: true,
  });
  const [regionModalError, setRegionModalError] = useState<string | null>(null);

  // Staff management states
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [staffPage, setStaffPage] = useState(1);
  const [staffPages, setStaffPages] = useState(1);
  const [staffLoading, setStaffLoading] = useState(false);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '' });
  const [staffModalError, setStaffModalError] = useState<string | null>(null);

  const [isStaffRegionsModalOpen, setIsStaffRegionsModalOpen] = useState(false);
  const [selectedStaffForRegions, setSelectedStaffForRegions] = useState<StaffMember | null>(null);
  const [staffRegionsForm, setStaffRegionsForm] = useState<string[]>([]);
  const [staffRegionsModalError, setStaffRegionsModalError] = useState<string | null>(null);

  const [isStaffShiftsModalOpen, setIsStaffShiftsModalOpen] = useState(false);
  const [selectedStaffForShifts, setSelectedStaffForShifts] = useState<StaffMember | null>(null);
  const [staffShiftsTimezone, setStaffShiftsTimezone] = useState('Asia/Karachi');
  const [staffShiftsForm, setStaffShiftsForm] = useState<{ dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[]>([]);
  const [staffShiftsModalError, setStaffShiftsModalError] = useState<string | null>(null);

  // UI UX additional states and refs
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);

  const [allActiveRegions, setAllActiveRegions] = useState<Region[]>([]);

  const { confirm } = useConfirm();

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

  // Fetch subscription plans
  const fetchSubPlans = useCallback(async () => {
    try {
      const res = await subscriptionService.getAllPlans();
      if (res.success) {
        setSubPlans(res.plans);
      }
    } catch (err) {
      console.error('Error fetching sub plans:', err);
    }
  }, []);

  // Fetch patient subscriptions log
  const fetchAdminSubscriptions = useCallback(async () => {
    setAdminSubLoading(true);
    try {
      const res = await subscriptionService.getAllSubscriptions(adminSubPage, 5);
      if (res.success && res.data) {
        setAdminSubscriptions(res.data.subscriptions || []);
        if (res.data.pagination) {
          setAdminSubPages(Math.ceil(res.data.pagination.total / res.data.pagination.limit) || 1);
          setAdminSubCount(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching subscriptions queue:', err);
    } finally {
      setAdminSubLoading(false);
    }
  }, [adminSubPage]);

  // Create or Update Subscription Plan
  const handleSubPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subPlanForm.name.trim()) {
      displayError('Plan name is required');
      return;
    }
    const cleanFeatures = subPlanForm.features.map(f => f.trim()).filter(f => f.length > 0);
    if (cleanFeatures.length === 0) {
      displayError('At least one feature is required');
      return;
    }

    try {
      if (editingSubPlan) {
        const res = await subscriptionService.updatePlan(editingSubPlan._id, {
          name: subPlanForm.name,
          price: subPlanForm.price,
          maxFamilyMembers: subPlanForm.maxFamilyMembers,
          features: cleanFeatures,
        });
        if (res.success) {
          displaySuccess('Subscription plan updated successfully');
          setIsSubPlanModalOpen(false);
          setEditingSubPlan(null);
          fetchSubPlans();
        }
      } else {
        const res = await subscriptionService.createPlan({
          name: subPlanForm.name,
          price: subPlanForm.price,
          maxFamilyMembers: subPlanForm.maxFamilyMembers,
          features: cleanFeatures,
        });
        if (res.success) {
          displaySuccess('Subscription plan created successfully');
          setIsSubPlanModalOpen(false);
          fetchSubPlans();
        }
      }
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleSubPlanDeactivate = (planId: string) => {
    confirm({
      title: 'Deactivate Plan',
      message: 'Are you sure you want to deactivate this subscription plan?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await subscriptionService.deactivatePlan(planId);
          if (res.success) {
            displaySuccess('Plan deactivated successfully');
            fetchSubPlans();
          }
        } catch (err: any) {
          displayError(err.response?.data?.message || 'Failed to deactivate plan');
        }
      },
    });
  };

  // Fetch Regions
  const fetchRegions = useCallback(async () => {
    setRegionLoading(true);
    try {
      const res = await regionService.getRegions({
        page: regionPage,
        limit: 8,
        search: regionSearchQuery.trim() || undefined,
        status: regionStatusFilter || undefined,
      });
      if (res.success && res.regions) {
        setRegions(res.regions);
        setRegionsCount(res.total || res.regions.length);
        setRegionPages(res.pages || 1);
      }
    } catch (err: any) {
      console.error('Error fetching regions:', err);
      displayError(err.response?.data?.message || 'Failed to load regions');
    } finally {
      setRegionLoading(false);
    }
  }, [regionPage, regionSearchQuery, regionStatusFilter]);

  // Create or Update Region
  const handleRegionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionForm.city.trim() || !regionForm.name.trim() || !regionForm.country.trim()) {
      setRegionModalError('City, Name and Country are required');
      return;
    }

    setRegionModalError(null);
    try {
      if (editingRegion && editingRegion._id) {
        const res = await regionService.updateRegion(editingRegion._id, regionForm);
        if (res.success) {
          displaySuccess('Region updated successfully');
          setIsRegionModalOpen(false);
          setEditingRegion(null);
          fetchRegions();
        }
      } else {
        const res = await regionService.createRegion(regionForm);
        if (res.success) {
          displaySuccess('Region created successfully');
          setIsRegionModalOpen(false);
          fetchRegions();
        }
      }
    } catch (err: any) {
      console.error('Error saving region:', err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorList = err.response.data.errors.map((e: any) => e.message).join('. ');
        setRegionModalError(errorList);
      } else {
        setRegionModalError(err.response?.data?.message || 'Failed to save region');
      }
    }
  };

  // Deactivate Region
  const handleRegionDeactivate = (regionId: string) => {
    confirm({
      title: 'Deactivate Region',
      message: 'Are you sure you want to deactivate this region?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await regionService.deleteRegion(regionId);
          if (res.success) {
            displaySuccess('Region deactivated successfully');
            fetchRegions();
          }
        } catch (err: any) {
          console.error('Error deactivating region:', err);
          displayError(err.response?.data?.message || 'Failed to deactivate region');
        }
      },
    });
  };

  // Fetch Staff
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await staffService.getStaff({
        page: staffPage,
        limit: 8,
      });
      if (res.success && res.data) {
        setStaffMembers(res.data.users);
        setStaffCount(res.data.pagination.total);
        setStaffPages(Math.ceil(res.data.pagination.total / res.data.pagination.limit) || 1);
      }
    } catch (err: any) {
      console.error('Error fetching staff members:', err);
      displayError(err.response?.data?.message || 'Failed to load staff members');
    } finally {
      setStaffLoading(false);
    }
  }, [staffPage]);

  // Fetch Coupons
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await couponService.getAllCoupons();
      if (res.success && res.data) {
        setCoupons(res.data.coupons);
      }
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
      displayError(err.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all active regions (for region selection)
  const fetchAllActiveRegions = async () => {
    try {
      const res = await regionService.getRegions({ limit: 100, status: 'active' });
      if (res.success && res.regions) {
        setAllActiveRegions(res.regions);
      }
    } catch (err) {
      console.error('Error fetching active regions list:', err);
    }
  };

  // Submit staff creation
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.email.trim()) {
      setStaffModalError('Name and Email are required');
      return;
    }
    setStaffModalError(null);
    try {
      const res = await staffService.createStaff(staffForm);
      if (res.success) {
        displaySuccess('Staff member created successfully. Welcome email sent!');
        setIsStaffModalOpen(false);
        setStaffForm({ name: '', email: '' });
        fetchStaff();
      }
    } catch (err: any) {
      console.error('Error creating staff:', err);
      setStaffModalError(err.response?.data?.message || 'Failed to create staff member');
    }
  };

  // Toggle staff active/inactive status
  const handleStaffStatusToggle = (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    confirm({
      title: `${currentStatus ? 'Deactivate' : 'Activate'} Staff Member`,
      message: `Are you sure you want to ${action} this staff member?`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await staffService.updateStaffStatus(id, !currentStatus);
          if (res.success) {
            displaySuccess(`Staff member ${action}d successfully`);
            fetchStaff();
          }
        } catch (err: any) {
          console.error('Error updating staff status:', err);
          displayError(err.response?.data?.message || 'Failed to update staff status');
        }
      },
    });
  };

  // Reset staff password
  const handleStaffPasswordReset = (id: string, name: string) => {
    confirm({
      title: 'Reset Password',
      message: `Are you sure you want to reset the password for ${name}? A new secure password will be generated and emailed to them.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await staffService.resetStaffPassword(id);
          if (res.success) {
            displaySuccess(`Password reset successfully. Credentials sent to ${name}'s email.`);
          }
        } catch (err: any) {
          console.error('Error resetting staff password:', err);
          displayError(err.response?.data?.message || 'Failed to reset password');
        }
      },
    });
  };

  // Submit regions update for staff
  const handleStaffRegionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForRegions) return;
    setStaffRegionsModalError(null);
    try {
      const res = await staffService.updateStaffRegions(selectedStaffForRegions._id, staffRegionsForm);
      if (res.success) {
        displaySuccess('Staff regions updated successfully');
        setIsStaffRegionsModalOpen(false);
        setSelectedStaffForRegions(null);
        fetchStaff();
      }
    } catch (err: any) {
      console.error('Error updating staff regions:', err);
      setStaffRegionsModalError(err.response?.data?.message || 'Failed to update staff regions');
    }
  };

  // Open shifts modal and populate form
  const openStaffShiftsModal = (member: StaffMember) => {
    setSelectedStaffForShifts(member);
    const tz = member.shifts?.[0]?.timezone || 'Asia/Karachi';
    setStaffShiftsTimezone(tz);

    const initialShifts = [];
    const daysOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun
    for (const d of daysOrder) {
      const existing = member.shifts?.find((s) => s.dayOfWeek === d);
      initialShifts.push({
        dayOfWeek: d,
        enabled: !!existing,
        startTime: existing?.startTime || '09:00',
        endTime: existing?.endTime || '17:00',
      });
    }
    setStaffShiftsForm(initialShifts);
    setStaffShiftsModalError(null);
    setIsStaffShiftsModalOpen(true);
  };

  // Submit shifts update
  const handleStaffShiftsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForShifts) return;
    setStaffShiftsModalError(null);

    const shiftsToSubmit = staffShiftsForm
      .filter((s) => s.enabled)
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        timezone: staffShiftsTimezone,
      }));

    try {
      const res = await staffService.updateStaffShifts(selectedStaffForShifts._id, shiftsToSubmit);
      if (res.success) {
        displaySuccess('Staff shifts updated successfully');
        setIsStaffShiftsModalOpen(false);
        setSelectedStaffForShifts(null);
        fetchStaff();
      }
    } catch (err: any) {
      console.error('Error updating staff shifts:', err);
      setStaffShiftsModalError(err.response?.data?.message || 'Failed to update staff shifts');
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
    } else if (activeTab === 'subscriptions') {
      fetchSubPlans();
      fetchAdminSubscriptions();
    } else if (activeTab === 'regions') {
      fetchRegions();
    } else if (activeTab === 'staff') {
      fetchStaff();
      fetchAllActiveRegions();
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [activeTab, testPage, dateRangePreset, bookingPage, bookingStatusFilter, bookingTypeFilter, bookingDateFilter, bookingSearchQuery, adminSubPage, regionPage, regionSearchQuery, regionStatusFilter, staffPage, fetchTests, fetchSubPlans, fetchAdminSubscriptions, fetchRegions, fetchStaff, fetchCoupons]);

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
  const handleCategoryDelete = (id: string) => {
    confirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await catalogService.deleteCategory(id);
          if (res.success) {
            displaySuccess('Category deleted successfully');
            fetchCategories();
          }
        } catch (err: any) {
          displayError(err.response?.data?.message || 'Cannot delete category: tests are still associated with it');
        }
      },
    });
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setIsCategoryModalOpen(true);
  };

  // Coupon CRUD Handlers
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      displayError('Coupon code is required');
      return;
    }
    if (couponForm.discountValue <= 0) {
      displayError('Discount value must be greater than 0');
      return;
    }

    try {
      const payload: any = {
        code: couponForm.code.trim().toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: couponForm.discountValue,
        minOrderValue: couponForm.minOrderValue === '' ? null : Number(couponForm.minOrderValue),
        maxUses: couponForm.maxUses === '' ? null : Number(couponForm.maxUses),
        expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : null,
        isActive: couponForm.isActive,
      };

      if (editingCoupon && editingCoupon._id) {
        await couponService.updateCoupon(editingCoupon._id, payload);
        displaySuccess('Coupon updated successfully');
      } else {
        await couponService.createCoupon(payload);
        displaySuccess('Coupon created successfully');
      }
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: '',
        maxUses: '',
        expiresAt: '',
        isActive: true,
      });
      fetchCoupons();
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Error saving coupon');
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    try {
      await couponService.updateCoupon(coupon._id, {
        isActive: !coupon.isActive,
      });
      displaySuccess(`Coupon status updated successfully`);
      fetchCoupons();
    } catch (err: any) {
      displayError(err.response?.data?.message || 'Error toggling coupon status');
    }
  };

  const handleCouponDelete = (id: string) => {
    confirm({
      title: 'Delete Coupon',
      message: 'Are you sure you want to delete this coupon code permanently?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await couponService.deleteCoupon(id);
          if (res.success) {
            displaySuccess('Coupon deleted successfully');
            fetchCoupons();
          }
        } catch (err: any) {
          displayError(err.response?.data?.message || 'Error deleting coupon');
        }
      },
    });
  };

  const openEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue ?? '',
      maxUses: coupon.maxUses ?? '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setIsCouponModalOpen(true);
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
  const handleTestDeactivate = (id: string) => {
    confirm({
      title: 'Deactivate Test',
      message: 'Are you sure you want to deactivate this test? It will be hidden from public catalog.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await catalogService.deactivateTest(id);
          displaySuccess('Test deactivated successfully');
          fetchTests();
        } catch (err: any) {
          displayError(err.response?.data?.message || 'Error deactivating test');
        }
      },
    });
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

  const handleCancelBooking = (bookingId: string) => {
    confirm({
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking?',
      variant: 'danger',
      onConfirm: async () => {
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
      },
    });
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
      case 'pending_manual_assignment':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-extrabold uppercase border border-rose-500/20 flex items-center gap-1">
            <AlertTriangle size={10} />
            <span>Pending Staff Assignment</span>
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
      {/* Main Content */}
      <div className="p-6 flex flex-col gap-8">
        {/* Alert Banners */}
        {success && (
          <AlertBanner
            variant="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}
        {error && (
          <AlertBanner
            variant="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Tab Contents */}
        <div className="space-y-8">
            
            {/* Analytics Tab (Feature 11) */}
            {activeTab === 'overview' && (() => {
              const totalBookings = overviewData?.totalBookings || 0;
              const totalRevenue = overviewData?.totalRevenue || 0;
              const newPatientsCount = overviewData?.newPatientsCount || 0;
              const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
              
              return (
                <>
                  {/* Numeric Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Bookings */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-blue-500/20 shadow-xs hover:shadow-md transition-all duration-300 group relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                            Total Bookings
                          </span>
                          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {totalBookings.toLocaleString()}
                          </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-105 transition-transform">
                          <ClipboardList size={18} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-full w-fit">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        <span>+8.2% vs last month</span>
                      </div>
                    </div>

                    {/* Card 2: Total Revenue */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-500/20 shadow-xs hover:shadow-md transition-all duration-300 group relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                            Total Revenue
                          </span>
                          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
                          <TrendingUp size={18} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-full w-fit">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        <span>+12.4% gross sales</span>
                      </div>
                    </div>

                    {/* Card 3: New Patients */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-purple-500/20 shadow-xs hover:shadow-md transition-all duration-300 group relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                            New Patients
                          </span>
                          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {newPatientsCount.toLocaleString()}
                          </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100/50 flex items-center justify-center text-purple-650 shadow-2xs group-hover:scale-105 transition-transform">
                          <UserPlus size={18} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-purple-600 bg-purple-50/50 px-2 py-0.5 rounded-full w-fit">
                        <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                        <span>+5.1% signups</span>
                      </div>
                    </div>

                    {/* Card 4: Average Order Value */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-amber-500/20 shadow-xs hover:shadow-md transition-all duration-300 group relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                            Average Order Value
                          </span>
                          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            ${avgOrderValue.toFixed(2)}
                          </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-105 transition-transform">
                          <FlaskConical size={18} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded-full w-fit">
                        <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                        <span>AOV per paid booking</span>
                      </div>
                    </div>
                  </div>

                  {/* Date preset selector */}
                  <div className="flex items-center justify-between bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Analytics Date Range</span>
                    <div className="flex bg-slate-105 p-0.5 rounded-xl border border-slate-200/50">
                      <button
                        onClick={() => setDateRangePreset('7days')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                          dateRangePreset === '7days'
                            ? 'bg-white text-brand-600 shadow-xs'
                            : 'text-slate-505 hover:text-slate-800'
                        }`}
                      >
                        7 Days
                      </button>
                      <button
                        onClick={() => setDateRangePreset('30days')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                          dateRangePreset === '30days'
                            ? 'bg-white text-brand-600 shadow-xs'
                            : 'text-slate-550 hover:text-slate-800'
                        }`}
                      >
                        30 Days
                      </button>
                      <button
                        onClick={() => setDateRangePreset('thismonth')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                          dateRangePreset === 'thismonth'
                            ? 'bg-white text-brand-600 shadow-xs'
                            : 'text-slate-550 hover:text-slate-800'
                        }`}
                      >
                        This Month
                      </button>
                    </div>
                  </div>

                  {/* Recharts Area / Bar charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bookings Trend */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Activity size={14} className="text-brand-500" />
                        <span>Bookings Over Time</span>
                      </h4>
                      <div className="h-64 w-full">
                        {bookingsTrends.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs">No trend data available</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bookingsTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} allowDecimals={false} dx={-5} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" name="bookings" dataKey="bookings" stroke="#2563eb" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={2.5} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Revenue Trend */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span>Revenue Growth ($)</span>
                      </h4>
                      <div className="h-64 w-full">
                        {revenueTrends.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs">No trend data available</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} dx={-5} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar name="revenue" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lower grid: Status Pie Chart and Top booked tests */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Pie Chart */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Activity size={14} className="text-brand-500" />
                        <span>Booking Status Distribution</span>
                      </h4>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-64">
                        {!overviewData?.statusBreakdown || overviewData.statusBreakdown.length === 0 ? (
                          <div className="text-slate-400 text-xs">No status data available</div>
                        ) : (
                          <>
                            <div className="w-1/2 h-full min-h-[180px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={overviewData.statusBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="count"
                                    nameKey="status"
                                  >
                                    {overviewData.statusBreakdown.map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }: any) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-lg text-xs font-bold text-slate-700">
                                            <span className="capitalize">{data.status.replace(/_/g, ' ')}</span>: {data.count} bookings
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            
                            {/* Legend list */}
                            <div className="flex-1 w-full max-h-[180px] overflow-y-auto space-y-1.5 pr-2">
                              {overviewData.statusBreakdown.map((item: any, idx: number) => {
                                const color = STATUS_COLORS[item.status] || '#94a3b8';
                                return (
                                  <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                      <span className="text-slate-500 capitalize truncate">{item.status.replace(/_/g, ' ')}</span>
                                    </div>
                                    <span className="text-slate-800 font-extrabold">{item.count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Top Booked Diagnostic Tests */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <FlaskConical size={14} className="text-brand-500" />
                        <span>Top Booked Diagnostic Tests</span>
                      </h4>
                      {topTests.length === 0 ? (
                        <p className="text-slate-400 text-xs py-4 text-center">No catalog sales logged yet.</p>
                      ) : (
                        <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1">
                          {topTests.slice(0, 5).map((t, idx) => {
                            const maxCount = topTests[0]?.bookingsCount || 1;
                            const pct = Math.min((t.bookingsCount / maxCount) * 100, 100);
                            return (
                              <div key={t.testId} className="flex items-center gap-3">
                                {/* Rank badge */}
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0 ${
                                  idx === 0 ? 'bg-amber-50 text-amber-600 border border-amber-105' :
                                  idx === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                  idx === 2 ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                  'bg-slate-50 text-slate-400 border border-slate-100'
                                }`}>
                                  #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-700 truncate">{t.name}</span>
                                    <span className="text-slate-900 shrink-0 font-extrabold">{t.bookingsCount} orders</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-brand-500 to-teal-500 h-full rounded-full"
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

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
                      <option value="pending_manual_assignment">Pending Staff Assignment</option>
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
                        <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                          
                          {booking.homeSampling.requested && (
                            <div className="w-full sm:w-auto">
                              {assigningBookingId === booking._id ? (
                                <form onSubmit={handleAssignStaffSubmit} className="flex flex-wrap items-center gap-1.5 w-full">
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
                                    className="p-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer animate-pulse-subtle whitespace-nowrap"
                                  >
                                    Assign
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAssigningBookingId(null)}
                                    className="p-1.5 rounded bg-zinc-800 text-zinc-400 text-xs transition-all cursor-pointer whitespace-nowrap"
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
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 transition-all cursor-pointer whitespace-nowrap"
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
                              className="px-3.5 py-1.5 rounded-lg border border-red-900/20 hover:border-red-900/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
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
                  <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
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
                              <td className="py-3.5 px-4 text-right">
                                {/* Inline Actions for Large Screens */}
                                <div className="hidden lg:inline-flex items-center gap-1.5">
                                  <div className="relative group">
                                    <button
                                      onClick={() => openEditTest(test)}
                                      className="p-1.5 rounded-lg border border-zinc-800 hover:border-purple-200 bg-zinc-900 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                      aria-label="Edit test details"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                      Edit test details
                                    </span>
                                  </div>
                                  
                                  {test.isActive !== false && (
                                    <div className="relative group">
                                      <button
                                        onClick={() => handleTestDeactivate(test._id || '')}
                                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                                        aria-label="Deactivate test"
                                      >
                                        <ShieldX size={14} />
                                      </button>
                                      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                        Deactivate test
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Responsive Kebab Dropdown for Smaller Screens */}
                                <div className={`lg:hidden inline-block relative text-left ${openKebabId === (test._id || '') ? 'z-30' : ''}`}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const id = test._id || '';
                                      setOpenKebabId(openKebabId === id ? null : id);
                                    }}
                                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                    title="More Actions"
                                    aria-label="More Actions"
                                    aria-haspopup="true"
                                    aria-expanded={openKebabId === (test._id || '')}
                                  >
                                    <MoreVertical size={12} />
                                  </button>

                                  {openKebabId === (test._id || '') && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                      <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                        <button
                                          onClick={() => {
                                            setOpenKebabId(null);
                                            openEditTest(test);
                                          }}
                                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                        >
                                          <Pencil size={12} />
                                          <span>Edit test details</span>
                                        </button>
                                        {test.isActive !== false && (
                                          <button
                                            onClick={() => {
                                              setOpenKebabId(null);
                                              handleTestDeactivate(test._id || '');
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                          >
                                            <ShieldX size={12} />
                                            <span>Deactivate test</span>
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {tests.map((test) => (
                        <div key={test._id} className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-zinc-200 text-sm">{test.name}</div>
                              <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                <span className="capitalize">{test.type} visit</span>
                                <span>•</span>
                                <span>{typeof test.categoryId === 'object' ? test.categoryId.name : 'Unknown'}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              test.isActive !== false
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {test.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-zinc-850/40 pt-3">
                            <span className="font-bold text-emerald-400 text-sm">${test.price.toFixed(2)}</span>
                            
                            <div className={`inline-block relative text-left ${openKebabId === (test._id || '') ? 'z-30' : ''}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const id = test._id || '';
                                  setOpenKebabId(openKebabId === id ? null : id);
                                }}
                                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="More Actions"
                                aria-label="More Actions"
                                aria-haspopup="true"
                                aria-expanded={openKebabId === (test._id || '')}
                              >
                                <MoreVertical size={14} />
                              </button>

                              {openKebabId === (test._id || '') && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                  <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                    <button
                                      onClick={() => {
                                        setOpenKebabId(null);
                                        openEditTest(test);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                    >
                                      <Pencil size={12} />
                                      <span>Edit test details</span>
                                    </button>
                                    {test.isActive !== false && (
                                      <button
                                        onClick={() => {
                                          setOpenKebabId(null);
                                          handleTestDeactivate(test._id || '');
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                      >
                                        <ShieldX size={12} />
                                        <span>Deactivate test</span>
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                        <div className="relative text-left shrink-0">
                          {/* Desktop Inline Actions */}
                          <div className="hidden sm:inline-flex items-center gap-1.5">
                            <div className="relative group">
                              <button
                                onClick={() => openEditCategory(cat)}
                                className="p-1.5 rounded-lg border border-zinc-800 hover:border-purple-200 bg-zinc-900 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                aria-label="Edit category"
                              >
                                <Pencil size={12} />
                              </button>
                              <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                Edit category
                              </span>
                            </div>
                            
                            <div className="relative group">
                              <button
                                onClick={() => handleCategoryDelete(cat._id || '')}
                                className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                                aria-label="Delete category"
                              >
                                <Trash2 size={12} />
                              </button>
                              <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                Delete category
                              </span>
                            </div>
                          </div>

                          {/* Mobile Kebab Dropdown */}
                          <div className={`sm:hidden inline-block relative text-left ${openKebabId === (cat._id || '') ? 'z-30' : ''}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const id = cat._id || '';
                                setOpenKebabId(openKebabId === id ? null : id);
                              }}
                              className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="More Actions"
                              aria-label="More Actions"
                              aria-haspopup="true"
                              aria-expanded={openKebabId === (cat._id || '')}
                            >
                              <MoreVertical size={12} />
                            </button>

                            {openKebabId === (cat._id || '') && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                  <button
                                    onClick={() => {
                                      setOpenKebabId(null);
                                      openEditCategory(cat);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                  >
                                    <Pencil size={12} />
                                    <span>Edit category</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenKebabId(null);
                                      handleCategoryDelete(cat._id || '');
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                    <span>Delete category</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
             )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-8">
                {/* 1. Subscription Plans Section */}
                <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-wide">Subscription Plans</h3>
                    <button
                      onClick={() => {
                        setEditingSubPlan(null);
                        setSubPlanForm({ name: '', price: 0, maxFamilyMembers: 0, features: [''] });
                        setIsSubPlanModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>Add Subscription Plan</span>
                    </button>
                  </div>

                  {subPlans.length === 0 ? (
                    <div className="py-12 text-center text-zinc-550 text-sm">
                      No subscription plans found in the database.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800 text-zinc-450 text-xs uppercase tracking-wider font-semibold">
                              <th className="py-3 px-4">Name</th>
                              <th className="py-3 px-4">Price</th>
                              <th className="py-3 px-4">Max Family Members</th>
                              <th className="py-3 px-4">Features</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subPlans.map((plan) => (
                              <tr key={plan._id} className="border-b border-zinc-850/50 hover:bg-zinc-900/30 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-zinc-200">{plan.name}</td>
                                <td className="py-3.5 px-4 font-bold text-emerald-400">${plan.price.toFixed(2)}/mo</td>
                                <td className="py-3.5 px-4 text-zinc-350 text-xs font-semibold">{plan.maxFamilyMembers}</td>
                                <td className="py-3.5 px-4 text-zinc-450 text-xs">
                                  <div className="flex flex-wrap gap-1">
                                    {plan.features.map((feat: string, i: number) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-zinc-850 border border-zinc-800 text-[10px] text-zinc-400 rounded">
                                        {feat}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    plan.isActive
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}>
                                    {plan.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  {/* Inline Actions for Large Screens */}
                                  <div className="hidden lg:inline-flex items-center gap-1.5">
                                    <div className="relative group">
                                      <button
                                        onClick={() => {
                                          setEditingSubPlan(plan);
                                          setSubPlanForm({
                                            name: plan.name,
                                            price: plan.price,
                                            maxFamilyMembers: plan.maxFamilyMembers,
                                            features: plan.features.length > 0 ? plan.features : [''],
                                          });
                                          setIsSubPlanModalOpen(true);
                                        }}
                                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-purple-200 bg-zinc-900 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                        aria-label="Edit subscription plan"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                        Edit subscription plan
                                      </span>
                                    </div>
                                    
                                    {plan.isActive && (
                                      <div className="relative group">
                                        <button
                                          onClick={() => handleSubPlanDeactivate(plan._id)}
                                          className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                                          aria-label="Deactivate subscription plan"
                                        >
                                          <ShieldX size={12} />
                                        </button>
                                        <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                          Deactivate subscription plan
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Responsive Kebab Dropdown for Smaller Screens */}
                                  <div className={`lg:hidden inline-block relative text-left ${openKebabId === plan._id ? 'z-30' : ''}`}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenKebabId(openKebabId === plan._id ? null : plan._id);
                                      }}
                                      className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                      title="More Actions"
                                      aria-label="More Actions"
                                      aria-haspopup="true"
                                      aria-expanded={openKebabId === plan._id}
                                    >
                                      <MoreVertical size={12} />
                                    </button>

                                    {openKebabId === plan._id && (
                                      <>
                                        <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                        <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                          <button
                                            onClick={() => {
                                              setOpenKebabId(null);
                                              setEditingSubPlan(plan);
                                              setSubPlanForm({
                                                name: plan.name,
                                                price: plan.price,
                                                maxFamilyMembers: plan.maxFamilyMembers,
                                                features: plan.features.length > 0 ? plan.features : [''],
                                              });
                                              setIsSubPlanModalOpen(true);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                          >
                                            <Pencil size={12} />
                                            <span>Edit subscription plan</span>
                                          </button>
                                          {plan.isActive && (
                                            <button
                                              onClick={() => {
                                                setOpenKebabId(null);
                                                handleSubPlanDeactivate(plan._id);
                                              }}
                                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                            >
                                              <ShieldX size={12} />
                                              <span>Deactivate subscription plan</span>
                                            </button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {subPlans.map((plan) => (
                          <div key={plan._id} className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-zinc-200 text-sm">{plan.name}</div>
                                <div className="text-[10px] text-zinc-450 mt-0.5">Max family members: {plan.maxFamilyMembers}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                plan.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {plan.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Features</span>
                              <div className="flex flex-wrap gap-1">
                                {plan.features.map((feat: string, i: number) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-zinc-850 border border-zinc-800 text-[10px] text-zinc-400 rounded">
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-zinc-850/40 pt-3">
                              <span className="font-bold text-emerald-400 text-sm">${plan.price.toFixed(2)}/mo</span>
                              
                            <div className={`inline-block relative text-left ${openKebabId === plan._id ? 'z-30' : ''}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenKebabId(openKebabId === plan._id ? null : plan._id);
                                }}
                                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="More Actions"
                                aria-label="More Actions"
                                aria-haspopup="true"
                                aria-expanded={openKebabId === plan._id}
                              >
                                <MoreVertical size={14} />
                              </button>

                              {openKebabId === plan._id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                  <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                    <button
                                      onClick={() => {
                                        setOpenKebabId(null);
                                        setEditingSubPlan(plan);
                                        setSubPlanForm({
                                          name: plan.name,
                                          price: plan.price,
                                          maxFamilyMembers: plan.maxFamilyMembers,
                                          features: plan.features.length > 0 ? plan.features : [''],
                                        });
                                        setIsSubPlanModalOpen(true);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                    >
                                      <Pencil size={12} />
                                      <span>Edit subscription plan</span>
                                    </button>
                                    {plan.isActive && (
                                      <button
                                        onClick={() => {
                                          setOpenKebabId(null);
                                          handleSubPlanDeactivate(plan._id);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                      >
                                        <ShieldX size={12} />
                                        <span>Deactivate subscription plan</span>
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Patient Subscriptions Log */}
                <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                  <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-wide">Patient Memberships History</h3>
                  
                  {adminSubLoading ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="w-8 h-8 rounded-full border-4 border-purple-500/20 border-t-purple-450 animate-spin"></div>
                    </div>
                  ) : adminSubscriptions.length === 0 ? (
                    <div className="py-12 text-center text-zinc-550 text-sm">
                      No patient subscription agreements found in the database.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800 text-zinc-450 text-xs uppercase tracking-wider font-semibold">
                              <th className="py-3 px-4">Sub ID</th>
                              <th className="py-3 px-4">Patient</th>
                              <th className="py-3 px-4">Plan Name</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Start Date</th>
                              <th className="py-3 px-4">Renewal Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminSubscriptions.map((sub) => (
                              <tr key={sub._id} className="border-b border-zinc-850/50 hover:bg-zinc-900/30 transition-colors">
                                <td className="py-3.5 px-4 font-mono text-zinc-400 text-xs">{sub._id.substring(18).toUpperCase()}</td>
                                <td className="py-3.5 px-4">
                                  <div className="text-zinc-200 font-semibold">{sub.userId?.name || 'N/A'}</div>
                                  <div className="text-zinc-550 text-[10px]">{sub.userId?.email || 'N/A'}</div>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-zinc-350 text-xs">
                                  {sub.planId?.name || 'Unknown'}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    sub.status === 'active'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : sub.status === 'cancelled'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}>
                                    {sub.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-zinc-450 text-xs">
                                  {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="py-3.5 px-4 text-zinc-450 text-xs">
                                  {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {adminSubscriptions.map((sub) => (
                          <div key={sub._id} className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl space-y-3 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-zinc-200">{sub.userId?.name || 'N/A'}</div>
                                <div className="text-[10px] text-zinc-550">{sub.userId?.email || 'N/A'}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                sub.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : sub.status === 'cancelled'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {sub.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                              <div>
                                <span className="text-zinc-500 block uppercase font-bold text-[8px]">Plan Name</span>
                                <span className="text-zinc-300 font-semibold">{sub.planId?.name || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block uppercase font-bold text-[8px]">Sub ID</span>
                                <span className="text-zinc-400 font-mono">{sub._id.substring(18).toUpperCase()}</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 block uppercase font-bold text-[8px]">Start Date</span>
                                <span className="text-zinc-400">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 block uppercase font-bold text-[8px]">Renewal Date</span>
                                <span className="text-zinc-400">{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {adminSubPages > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-2">
                      <button
                        onClick={() => setAdminSubPage((prev) => Math.max(prev - 1, 1))}
                        disabled={adminSubPage === 1 || adminSubLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <ChevronLeft size={14} />
                        <span>Previous</span>
                      </button>
                      <span className="text-zinc-550 text-xs font-extrabold uppercase">
                        Page {adminSubPage} of {adminSubPages} (Total {adminSubCount})
                      </span>
                      <button
                        onClick={() => setAdminSubPage((prev) => Math.min(prev + 1, adminSubPages))}
                        disabled={adminSubPage === adminSubPages || adminSubLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Regions Tab */}
            {activeTab === 'regions' && (
              <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-wide">Sampling Regions</h3>
                  <button
                    onClick={() => {
                      setEditingRegion(null);
                      setRegionForm({ city: '', name: '', country: 'Pakistan', isActive: true });
                      setRegionModalError(null);
                      setIsRegionModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add Region</span>
                  </button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search by city, name..."
                      value={regionSearchQuery}
                      onChange={(e) => {
                        setRegionSearchQuery(e.target.value);
                        setRegionPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-250 placeholder:text-zinc-650 text-xs focus:outline-none focus:border-purple-550 transition-colors"
                    />
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <select
                      value={regionStatusFilter}
                      onChange={(e) => {
                        setRegionStatusFilter(e.target.value);
                        setRegionPage(1);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 text-xs focus:outline-none bg-zinc-950 cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>

                {regionLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-purple-500/20 border-t-purple-450 animate-spin"></div>
                  </div>
                ) : regions.length === 0 ? (
                  <div className="py-12 text-center text-zinc-550 text-sm">
                    No sampling regions found matching filters.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-450 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-3 px-4">Region ID</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">City</th>
                            <th className="py-3 px-4">Country</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regions.map((reg) => (
                            <tr key={reg._id} className="border-b border-zinc-850/50 hover:bg-zinc-900/30 transition-colors">
                              <td className="py-3.5 px-4 font-mono text-zinc-400 text-xs">{reg._id}</td>
                              <td className="py-3.5 px-4 font-semibold text-zinc-200">{reg.name}</td>
                              <td className="py-3.5 px-4 text-zinc-350 text-xs font-semibold">{reg.city}</td>
                              <td className="py-3.5 px-4 text-zinc-350 text-xs">{reg.country}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  reg.isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {reg.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {/* Inline Actions for Large Screens */}
                                <div className="hidden lg:inline-flex items-center gap-1.5">
                                  <div className="relative group">
                                    <button
                                      onClick={() => {
                                        setEditingRegion(reg);
                                        setRegionForm({
                                          city: reg.city,
                                          name: reg.name,
                                          country: reg.country,
                                          isActive: reg.isActive,
                                        });
                                        setRegionModalError(null);
                                        setIsRegionModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg border border-zinc-800 hover:border-purple-200 bg-zinc-900 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                      aria-label="Edit sampling region"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                      Edit sampling region
                                    </span>
                                  </div>
                                  
                                  {reg.isActive && (
                                    <div className="relative group">
                                      <button
                                        onClick={() => handleRegionDeactivate(reg._id)}
                                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                                        aria-label="Deactivate sampling region"
                                      >
                                        <ShieldX size={12} />
                                      </button>
                                      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                        Deactivate sampling region
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Responsive Kebab Dropdown for Smaller Screens */}
                                <div className={`lg:hidden inline-block relative text-left ${openKebabId === reg._id ? 'z-30' : ''}`}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenKebabId(openKebabId === reg._id ? null : reg._id);
                                    }}
                                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                    title="More Actions"
                                    aria-label="More Actions"
                                    aria-haspopup="true"
                                    aria-expanded={openKebabId === reg._id}
                                  >
                                    <MoreVertical size={12} />
                                  </button>

                                  {openKebabId === reg._id && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                      <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                        <button
                                          onClick={() => {
                                            setOpenKebabId(null);
                                            setEditingRegion(reg);
                                            setRegionForm({
                                              city: reg.city,
                                              name: reg.name,
                                              country: reg.country,
                                              isActive: reg.isActive,
                                            });
                                            setRegionModalError(null);
                                            setIsRegionModalOpen(true);
                                          }}
                                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                        >
                                          <Pencil size={12} />
                                          <span>Edit sampling region</span>
                                        </button>
                                        {reg.isActive && (
                                          <button
                                            onClick={() => {
                                              setOpenKebabId(null);
                                              handleRegionDeactivate(reg._id);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                          >
                                            <ShieldX size={12} />
                                            <span>Deactivate sampling region</span>
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {regions.map((reg) => (
                        <div key={reg._id} className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-zinc-200 text-sm">{reg.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{reg._id}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              reg.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {reg.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-zinc-850/40 pt-3">
                            <div className="text-[10px] text-zinc-400">
                              {reg.city}, {reg.country}
                            </div>
                            
                            <div className={`inline-block relative text-left ${openKebabId === reg._id ? 'z-30' : ''}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenKebabId(openKebabId === reg._id ? null : reg._id);
                                }}
                                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="More Actions"
                                aria-label="More Actions"
                                aria-haspopup="true"
                                aria-expanded={openKebabId === reg._id}
                              >
                                <MoreVertical size={14} />
                              </button>

                              {openKebabId === reg._id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                  <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                    <button
                                      onClick={() => {
                                        setOpenKebabId(null);
                                        setEditingRegion(reg);
                                        setRegionForm({
                                          city: reg.city,
                                          name: reg.name,
                                          country: reg.country,
                                          isActive: reg.isActive,
                                        });
                                        setRegionModalError(null);
                                        setIsRegionModalOpen(true);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                    >
                                      <Pencil size={12} />
                                      <span>Edit sampling region</span>
                                    </button>
                                    {reg.isActive && (
                                      <button
                                        onClick={() => {
                                          setOpenKebabId(null);
                                          handleRegionDeactivate(reg._id);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                      >
                                        <ShieldX size={12} />
                                        <span>Deactivate sampling region</span>
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {regionPages > 1 && (
                  <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-2">
                    <button
                      onClick={() => setRegionPage((prev) => Math.max(prev - 1, 1))}
                      disabled={regionPage === 1 || regionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <span className="text-zinc-550 text-xs font-extrabold uppercase">
                      Page {regionPage} of {regionPages} (Total {regionsCount})
                    </span>
                    <button
                      onClick={() => setRegionPage((prev) => Math.min(prev + 1, regionPages))}
                      disabled={regionPage === regionPages || regionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Staff Management Tab */}
            {activeTab === 'staff' && (
              <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-wide">Staff Management</h3>
                  <button
                    onClick={() => {
                      setStaffForm({ name: '', email: '' });
                      setStaffModalError(null);
                      setIsStaffModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Create Staff Account</span>
                  </button>
                </div>

                {staffLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-purple-500/20 border-t-purple-450 animate-spin"></div>
                  </div>
                ) : staffMembers.length === 0 ? (
                  <div className="py-12 text-center text-zinc-550 text-sm">
                    No staff members found in the database.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-450 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Assigned Regions</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffMembers.map((member) => (
                            <tr key={member._id} className="border-b border-zinc-850/50 hover:bg-zinc-900/30 transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-zinc-200">
                                {member.name}
                              </td>
                              <td className="py-3.5 px-4 text-zinc-350 text-xs">{member.email}</td>
                              <td className="py-3.5 px-4 text-zinc-450 text-xs">
                                <div className="flex flex-wrap gap-1">
                                  {member.assignedRegions.length === 0 ? (
                                    <span className="text-zinc-600 italic">None</span>
                                  ) : (
                                    member.assignedRegions.map((regId) => (
                                      <span key={regId} className="px-1.5 py-0.5 bg-zinc-850 border border-zinc-800 text-[10px] text-purple-300 rounded font-mono">
                                        {regId}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  member.isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {member.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {/* Inline Actions for Large Screens */}
                                <div className="hidden lg:inline-flex items-center gap-1.5">
                                  {member.isActive && (
                                    <div className="relative group">
                                      <button
                                        onClick={() => {
                                          setSelectedStaffForRegions(member);
                                          setStaffRegionsForm(member.assignedRegions);
                                          setStaffRegionsModalError(null);
                                          setIsStaffRegionsModalOpen(true);
                                        }}
                                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-purple-200 bg-zinc-900 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                        aria-label="Manage assigned regions"
                                      >
                                        <MapPin size={12} />
                                      </button>
                                      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                        Manage assigned regions
                                      </span>
                                    </div>
                                  )}
                                  
                                  {member.isActive && (
                                    <div className="relative group">
                                      <button
                                        onClick={() => openStaffShiftsModal(member)}
                                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-purple-200 bg-zinc-900 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                        aria-label="Edit shift schedule"
                                      >
                                        <Clock size={12} />
                                      </button>
                                      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                        Edit shift schedule
                                      </span>
                                    </div>
                                  )}

                                  <div className="relative group">
                                    <button
                                      onClick={() => handleStaffPasswordReset(member._id, member.name)}
                                      className="p-1.5 rounded-lg border border-zinc-800 hover:border-purple-200 bg-zinc-900 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                      aria-label="Reset password"
                                    >
                                      <Key size={12} />
                                    </button>
                                    <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                      Reset password
                                    </span>
                                  </div>

                                  <div className="relative group">
                                    <button
                                      onClick={() => handleStaffStatusToggle(member._id, member.isActive)}
                                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer inline-flex items-center justify-center ${
                                        member.isActive
                                          ? 'border-zinc-800 hover:border-red-900 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400'
                                          : 'border-zinc-800 hover:border-emerald-200 bg-zinc-900 hover:bg-emerald-50 text-zinc-400 hover:text-emerald-500'
                                      }`}
                                      aria-label={member.isActive ? "Deactivate staff member" : "Activate staff member"}
                                    >
                                      {member.isActive ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                    </button>
                                    <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                      {member.isActive ? "Deactivate staff" : "Activate staff"}
                                    </span>
                                  </div>
                                </div>

                                {/* Responsive Kebab Dropdown for Smaller Screens */}
                                <div className={`lg:hidden inline-block relative text-left ${openKebabId === member._id ? 'z-30' : ''}`}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenKebabId(openKebabId === member._id ? null : member._id);
                                    }}
                                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                    title="More Actions"
                                    aria-label="More Actions"
                                    aria-haspopup="true"
                                    aria-expanded={openKebabId === member._id}
                                  >
                                    <MoreVertical size={12} />
                                  </button>

                                  {openKebabId === member._id && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                      <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                        {member.isActive && (
                                          <button
                                            onClick={() => {
                                              setOpenKebabId(null);
                                              setSelectedStaffForRegions(member);
                                              setStaffRegionsForm(member.assignedRegions);
                                              setStaffRegionsModalError(null);
                                              setIsStaffRegionsModalOpen(true);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                          >
                                            <MapPin size={12} />
                                            <span>Manage assigned regions</span>
                                          </button>
                                        )}
                                        {member.isActive && (
                                          <button
                                            onClick={() => {
                                              setOpenKebabId(null);
                                              openStaffShiftsModal(member);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                          >
                                            <Clock size={12} />
                                            <span>Edit shift schedule</span>
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            setOpenKebabId(null);
                                            handleStaffPasswordReset(member._id, member.name);
                                          }}
                                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                        >
                                          <Key size={12} />
                                          <span>Reset password</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            setOpenKebabId(null);
                                            handleStaffStatusToggle(member._id, member.isActive);
                                          }}
                                          className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors ${
                                            member.isActive 
                                              ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                                              : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                          }`}
                                        >
                                          {member.isActive ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                          <span>{member.isActive ? 'Deactivate staff member' : 'Activate staff member'}</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {staffMembers.map((member) => (
                        <div key={member._id} className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-zinc-200 text-sm">{member.name}</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">{member.email}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              member.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Assigned Regions</span>
                            <div className="flex flex-wrap gap-1">
                              {member.assignedRegions.length === 0 ? (
                                <span className="text-zinc-650 text-xs italic">None</span>
                              ) : (
                                member.assignedRegions.map((regId) => (
                                  <span key={regId} className="px-1.5 py-0.5 bg-zinc-850 border border-zinc-800 text-[10px] text-purple-300 rounded font-mono">
                                    {regId}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end border-t border-zinc-850/40 pt-3 relative">
                            <div className={`inline-block relative text-left ${openKebabId === member._id ? 'z-30' : ''}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenKebabId(openKebabId === member._id ? null : member._id);
                                }}
                                className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="More Actions"
                                aria-label="More Actions"
                                aria-haspopup="true"
                                aria-expanded={openKebabId === member._id}
                              >
                                <MoreVertical size={14} />
                              </button>

                              {openKebabId === member._id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                  <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                    {member.isActive && (
                                      <button
                                        onClick={() => {
                                          setOpenKebabId(null);
                                          setSelectedStaffForRegions(member);
                                          setStaffRegionsForm(member.assignedRegions);
                                          setStaffRegionsModalError(null);
                                          setIsStaffRegionsModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                      >
                                        <MapPin size={12} />
                                        <span>Manage assigned regions</span>
                                      </button>
                                    )}
                                    {member.isActive && (
                                      <button
                                        onClick={() => {
                                          setOpenKebabId(null);
                                          openStaffShiftsModal(member);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                      >
                                        <Clock size={12} />
                                        <span>Edit shift schedule</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setOpenKebabId(null);
                                        handleStaffPasswordReset(member._id, member.name);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                                    >
                                      <Key size={12} />
                                      <span>Reset password</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenKebabId(null);
                                        handleStaffStatusToggle(member._id, member.isActive);
                                      }}
                                      className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors ${
                                        member.isActive 
                                          ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                                          : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                      }`}
                                    >
                                      {member.isActive ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                      <span>{member.isActive ? 'Deactivate staff member' : 'Activate staff member'}</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {staffPages > 1 && (
                  <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-2">
                    <button
                      onClick={() => setStaffPage((prev) => Math.max(prev - 1, 1))}
                      disabled={staffPage === 1 || staffLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <span className="text-zinc-550 text-xs font-extrabold uppercase">
                      Page {staffPage} of {staffPages} (Total {staffCount})
                    </span>
                    <button
                      onClick={() => setStaffPage((prev) => Math.min(prev + 1, staffPages))}
                      disabled={staffPage === staffPages || staffLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Coupons Management Tab */}
            {activeTab === 'coupons' && (
              <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-wide">Discount Coupons</h3>
                  <button
                    onClick={() => {
                      setEditingCoupon(null);
                      setCouponForm({
                        code: '',
                        discountType: 'percentage',
                        discountValue: 0,
                        minOrderValue: '',
                        maxUses: '',
                        expiresAt: '',
                        isActive: true,
                      });
                      setIsCouponModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Create Coupon</span>
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-purple-500/20 border-t-purple-450 animate-spin"></div>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="py-12 text-center text-zinc-550 text-sm">
                    No discount coupons found in the database.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-450 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-3 px-4">Code</th>
                            <th className="py-3 px-4">Discount</th>
                            <th className="py-3 px-4">Min Order</th>
                            <th className="py-3 px-4">Usage (Uses / Max)</th>
                            <th className="py-3 px-4">Expiry Date</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map((coupon) => {
                            const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;
                            return (
                              <tr key={coupon._id} className="border-b border-zinc-850/50 hover:bg-zinc-900/30 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">
                                  {coupon.code}
                                </td>
                                <td className="py-3.5 px-4 text-zinc-300 text-xs font-semibold">
                                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `$${coupon.discountValue.toFixed(2)} Off`}
                                </td>
                                <td className="py-3.5 px-4 text-zinc-400 text-xs">
                                  {coupon.minOrderValue ? `$${coupon.minOrderValue.toFixed(2)}` : 'None'}
                                </td>
                                <td className="py-3.5 px-4 text-zinc-400 text-xs">
                                  {coupon.usedCount} / {coupon.maxUses ?? '∞'}
                                </td>
                                <td className="py-3.5 px-4 text-xs">
                                  {coupon.expiresAt ? (
                                    <span className={isExpired ? 'text-red-400 font-semibold' : 'text-zinc-450'}>
                                      {new Date(coupon.expiresAt).toLocaleDateString()} {isExpired && '(Expired)'}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-650 italic font-medium">Never</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    coupon.isActive && !isExpired
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}>
                                    {coupon.isActive ? (isExpired ? 'Expired' : 'Active') : 'Inactive'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  {/* Inline Actions for Large Screens */}
                                  <div className="hidden lg:inline-flex items-center gap-1.5">
                                    {/* Edit Coupon */}
                                    <div className="relative group">
                                      <button
                                        onClick={() => openEditCoupon(coupon)}
                                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-purple-200 bg-zinc-900 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                        aria-label="Edit Coupon"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                        Edit Coupon
                                      </span>
                                    </div>

                                    {/* Toggle Active Status */}
                                    <div className="relative group">
                                      <button
                                        onClick={() => handleToggleCouponStatus(coupon)}
                                        className={`p-1.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer inline-flex items-center justify-center ${
                                          coupon.isActive
                                            ? 'hover:border-amber-200 bg-zinc-900 hover:bg-amber-50 text-zinc-400 hover:text-amber-600'
                                            : 'hover:border-emerald-200 bg-zinc-900 hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600'
                                        }`}
                                        aria-label={coupon.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                                      >
                                        {coupon.isActive ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                      </button>
                                      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                        {coupon.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                                      </span>
                                    </div>

                                    {/* Delete Coupon */}
                                    <div className="relative group">
                                      <button
                                        onClick={() => handleCouponDelete(coupon._id)}
                                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-200 bg-zinc-900 hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                                        aria-label="Delete Coupon"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-35 font-medium shadow-xl">
                                        Delete Coupon
                                      </span>
                                    </div>
                                  </div>

                                  {/* Responsive Kebab Dropdown for Smaller Screens */}
                                  <div className={`lg:hidden inline-block relative text-left ${openKebabId === coupon._id ? 'z-30' : ''}`}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenKebabId(openKebabId === coupon._id ? null : coupon._id);
                                      }}
                                      className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                      title="More Actions"
                                      aria-label="More Actions"
                                      aria-haspopup="true"
                                      aria-expanded={openKebabId === coupon._id}
                                    >
                                      <MoreVertical size={12} />
                                    </button>

                                    {openKebabId === coupon._id && (
                                      <>
                                        <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                        <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-40 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                          <button
                                            onClick={() => {
                                              setOpenKebabId(null);
                                              openEditCoupon(coupon);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-650 transition-colors"
                                          >
                                            <Pencil size={12} />
                                            <span>Edit Coupon</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              setOpenKebabId(null);
                                              handleToggleCouponStatus(coupon);
                                            }}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors ${
                                              coupon.isActive
                                                ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                                                : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                            }`}
                                          >
                                            {coupon.isActive ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                            <span>{coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              setOpenKebabId(null);
                                              handleCouponDelete(coupon._id);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-650 hover:bg-red-50 hover:text-red-700 transition-colors"
                                          >
                                            <Trash2 size={12} />
                                            <span>Delete Coupon</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {coupons.map((coupon) => {
                        const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;
                        return (
                          <div key={coupon._id} className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-mono font-bold text-zinc-200 text-sm">{coupon.code}</div>
                                <div className="text-[10px] text-zinc-500 flex flex-col gap-1 mt-1.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-purple-400">
                                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `$${coupon.discountValue.toFixed(2)} Off`}
                                    </span>
                                    <span className="text-zinc-700">•</span>
                                    <span>Min Order: {coupon.minOrderValue ? `$${coupon.minOrderValue.toFixed(2)}` : 'None'}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span>Usage: {coupon.usedCount} / {coupon.maxUses ?? '∞'}</span>
                                    <span className="text-zinc-700">•</span>
                                    <span>
                                      Expiry: {coupon.expiresAt ? (
                                        <span className={isExpired ? 'text-red-400 font-semibold' : ''}>
                                          {new Date(coupon.expiresAt).toLocaleDateString()} {isExpired && '(Expired)'}
                                        </span>
                                      ) : (
                                        <span className="text-zinc-650 italic">Never</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                coupon.isActive && !isExpired
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {coupon.isActive ? (isExpired ? 'Expired' : 'Active') : 'Inactive'}
                              </span>
                            </div>

                            <div className="flex justify-end items-center border-t border-zinc-850/40 pt-3">
                              <div className={`inline-block relative text-left ${openKebabId === coupon._id ? 'z-30' : ''}`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenKebabId(openKebabId === coupon._id ? null : coupon._id);
                                  }}
                                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-450 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                                  title="More Actions"
                                  aria-label="More Actions"
                                  aria-haspopup="true"
                                  aria-expanded={openKebabId === coupon._id}
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {openKebabId === coupon._id && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => setOpenKebabId(null)} />
                                    <div className="absolute right-0 bottom-full mb-1.5 w-60 rounded-xl border border-slate-200/80 bg-white shadow-2xl z-45 overflow-hidden font-medium py-1 text-left animate-fadeIn">
                                      <button
                                        onClick={() => {
                                          setOpenKebabId(null);
                                          openEditCoupon(coupon);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-650 transition-colors"
                                      >
                                        <Pencil size={12} />
                                        <span>Edit Coupon</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setOpenKebabId(null);
                                          handleToggleCouponStatus(coupon);
                                        }}
                                        className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors ${
                                          coupon.isActive
                                            ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                                            : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                        }`}
                                      >
                                        {coupon.isActive ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                        <span>{coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setOpenKebabId(null);
                                          handleCouponDelete(coupon._id);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-650 hover:bg-red-50 hover:text-red-700 transition-colors"
                                      >
                                        <Trash2 size={12} />
                                        <span>Delete Coupon</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
           </div>

      {/* Coupon Creation / Edit Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glassmorphic-card rounded-3xl p-6 relative bg-zinc-900 border border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 font-sans">
              {editingCoupon ? 'Edit Discount Coupon' : 'Create Discount Coupon'}
            </h3>
            
            <form onSubmit={handleCouponSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 mb-1.5">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="E.G., SUMMER25"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-medium focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 mb-1.5">Discount Type *</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-medium focus:outline-none focus:border-purple-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 mb-1.5">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    placeholder="E.G., 10"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 mb-1.5">Min Order Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 mb-1.5">Expiry Date</label>
                <input
                  type="date"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-zinc-800 bg-zinc-950 rounded focus:ring-purple-500"
                />
                <label htmlFor="couponActive" className="text-xs font-semibold text-zinc-300 select-none">
                  Make coupon active immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => {
                    setIsCouponModalOpen(false);
                    setEditingCoupon(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-850 hover:bg-zinc-850 text-zinc-400 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Region Creation / Edit Modal */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glassmorphic-card rounded-3xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 font-sans">
              {editingRegion ? 'Edit Region' : 'Create Sampling Region'}
            </h3>
            
            {regionModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{regionModalError}</span>
              </div>
            )}
            
            <form onSubmit={handleRegionSubmit} className="space-y-4">
              {editingRegion && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Region ID (Immutable)
                  </label>
                  <input
                    type="text"
                    value={editingRegion._id}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-zinc-500 text-sm focus:outline-none opacity-60 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Region Name / Neighborhood
                </label>
                <input
                  type="text"
                  value={regionForm.name}
                  onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                  placeholder="e.g. Johar Town, Gulberg, Manhattan"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={regionForm.city}
                  onChange={(e) => setRegionForm({ ...regionForm, city: e.target.value })}
                  placeholder="e.g. Lahore, Karachi, New York"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={regionForm.country}
                  onChange={(e) => setRegionForm({ ...regionForm, country: e.target.value })}
                  placeholder="e.g. Pakistan, United States"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                  required
                />
              </div>

              {editingRegion && (
                <div className="flex items-center gap-3 p-3 bg-zinc-900/20 border border-zinc-850 rounded-2xl">
                  <input
                    type="checkbox"
                    id="region-is-active"
                    checked={regionForm.isActive}
                    onChange={(e) => setRegionForm({ ...regionForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="region-is-active" className="text-xs font-bold text-zinc-350 cursor-pointer">
                    Region is Active (Available for selection on checkout)
                  </label>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegionModalOpen(false);
                    setEditingRegion(null);
                    setRegionModalError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {editingRegion ? 'Save Changes' : 'Create Region'}
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

      {/* Subscription Plan Creation / Edit Modal */}
      {isSubPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md glassmorphic-card rounded-3xl p-6 relative my-8">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 font-sans">
              {editingSubPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
            </h3>
            
            <form onSubmit={handleSubPlanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={subPlanForm.name}
                  onChange={(e) => setSubPlanForm({ ...subPlanForm, name: e.target.value })}
                  placeholder="e.g. Basic Family, Premium Care"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    value={subPlanForm.price}
                    onChange={(e) => setSubPlanForm({ ...subPlanForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="29.99"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Max Family Members
                  </label>
                  <input
                    type="number"
                    value={subPlanForm.maxFamilyMembers}
                    onChange={(e) => setSubPlanForm({ ...subPlanForm, maxFamilyMembers: parseInt(e.target.value, 10) || 0 })}
                    placeholder="3"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Features List
                  </label>
                  <button
                    type="button"
                    onClick={() => setSubPlanForm({ ...subPlanForm, features: [...subPlanForm.features, ''] })}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold transition-all"
                  >
                    + Add Feature
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {subPlanForm.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const updated = [...subPlanForm.features];
                          updated[index] = e.target.value;
                          setSubPlanForm({ ...subPlanForm, features: updated });
                        }}
                        placeholder={`Feature #${index + 1}`}
                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
                        required
                      />
                      {subPlanForm.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = subPlanForm.features.filter((_, i) => i !== index);
                            setSubPlanForm({ ...subPlanForm, features: updated });
                          }}
                          className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-450 hover:text-red-400 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubPlanModalOpen(false);
                    setEditingSubPlan(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {editingSubPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glassmorphic-card rounded-3xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 font-sans">
              Create Staff Account
            </h3>
            
            {staffModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{staffModalError}</span>
              </div>
            )}
            
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="e.g. john@lablink.com"
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-650 focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-[11px] text-purple-300 leading-relaxed">
                <strong>Notice:</strong> The password will be automatically generated and shared with the staff member by email. They can update it from their profile at any time.
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsStaffModalOpen(false);
                    setStaffModalError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Regions Modal */}
      {isStaffRegionsModalOpen && selectedStaffForRegions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glassmorphic-card rounded-3xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-100 mb-2 font-sans">
              Assign Regions
            </h3>
            <p className="text-xs text-zinc-450 mb-6">
              Select the active sampling regions for <strong>{selectedStaffForRegions.name}</strong>.
            </p>

            {staffRegionsModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{staffRegionsModalError}</span>
              </div>
            )}

            <form onSubmit={handleStaffRegionsSubmit} className="space-y-4">
              <div className="max-h-60 overflow-y-auto border border-zinc-850 rounded-2xl p-3 space-y-2.5 bg-zinc-950/40">
                {allActiveRegions.length === 0 ? (
                  <div className="text-center text-zinc-550 text-xs py-6">
                    No active regions available. Activate them first in the Regions tab.
                  </div>
                ) : (
                  allActiveRegions.map((reg) => {
                    const isChecked = staffRegionsForm.includes(reg._id);
                    return (
                      <label key={reg._id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-zinc-900/40 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStaffRegionsForm([...staffRegionsForm, reg._id]);
                            } else {
                              setStaffRegionsForm(staffRegionsForm.filter((id) => id !== reg._id));
                            }
                          }}
                          className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-purple-650 focus:ring-purple-500/30 accent-purple-600 cursor-pointer"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-zinc-350">{reg.name}</div>
                          <div className="text-[10px] text-zinc-500">{reg.city}, {reg.country}</div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsStaffRegionsModalOpen(false);
                    setSelectedStaffForRegions(null);
                    setStaffRegionsModalError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Shifts Modal */}
      {isStaffShiftsModalOpen && selectedStaffForShifts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glassmorphic-card rounded-3xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-100 mb-2 font-sans">
              Manage Shifts
            </h3>
            <p className="text-xs text-zinc-450 mb-6">
              Configure working timezone, shifts, and active days for <strong>{selectedStaffForShifts.name}</strong>.
            </p>

            {staffShiftsModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{staffShiftsModalError}</span>
              </div>
            )}

            <form onSubmit={handleStaffShiftsSubmit} className="space-y-4">
              {/* Timezone Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Staff Work Timezone</label>
                <select
                  value={staffShiftsTimezone}
                  onChange={(e) => setStaffShiftsTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 accent-purple-650 cursor-pointer font-medium"
                >
                  <option value="Asia/Karachi">Pakistan Standard Time (Asia/Karachi - PKT)</option>
                  <option value="Europe/London">United Kingdom Time (Europe/London - GMT/BST)</option>
                  <option value="America/New_York">United States Time (America/New_York - EST/EDT)</option>
                  <option value="America/Los_Angeles">United States Time (America/Los_Angeles - PST/PDT)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>

              {/* Day Shifts Table */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Weekly Shift Schedule</label>
                <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-950/40 p-1">
                  <div className="max-h-[220px] overflow-y-auto space-y-2.5 p-2">
                    {staffShiftsForm.map((s, index) => {
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const dayName = dayNames[s.dayOfWeek];
                      return (
                        <div key={s.dayOfWeek} className="flex items-center justify-between gap-3 p-2 bg-zinc-900/20 border border-zinc-850 hover:bg-zinc-900/40 rounded-xl transition-colors">
                          <label className="flex items-center gap-2.5 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={s.enabled}
                              onChange={(e) => {
                                const copy = [...staffShiftsForm];
                                copy[index].enabled = e.target.checked;
                                setStaffShiftsForm(copy);
                              }}
                              className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-purple-650 focus:ring-purple-500/30 accent-purple-600 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-zinc-350 w-20">{dayName}</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              disabled={!s.enabled}
                              value={s.startTime}
                              onChange={(e) => {
                                const copy = [...staffShiftsForm];
                                copy[index].startTime = e.target.value;
                                setStaffShiftsForm(copy);
                              }}
                              className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-purple-500/60"
                            />
                            <span className="text-zinc-500 text-xs">-</span>
                            <input
                              type="time"
                              disabled={!s.enabled}
                              value={s.endTime}
                              onChange={(e) => {
                                const copy = [...staffShiftsForm];
                                copy[index].endTime = e.target.value;
                                setStaffShiftsForm(copy);
                              }}
                              className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-purple-500/60"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsStaffShiftsModalOpen(false);
                    setSelectedStaffForShifts(null);
                    setStaffShiftsModalError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Shifts
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
