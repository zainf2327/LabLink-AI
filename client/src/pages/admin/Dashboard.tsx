import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { catalogService } from '../../services/catalog.service';
import type { Category, Test } from '../../services/catalog.service';
import { LogOut, User, Phone, Mail, Shield, ShieldCheck, Database, Settings, LayoutGrid, Plus, Pencil, Trash2, ShieldX, CheckCircle, AlertTriangle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'categories'>('overview');

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

  // Load initial data
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (activeTab === 'tests') {
      fetchTests();
    }
  }, [activeTab, testPage, fetchTests]);

  const displaySuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const displayError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

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

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="font-extrabold text-black text-lg">LL</span>
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
                  LabLink AI
                </span>
                <span className="text-zinc-500 text-xs block -mt-1">Administration Control</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden md:inline">
                Welcome back, <strong className="text-zinc-200">{user?.name}</strong>
              </span>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-purple-450 transition-all duration-200 cursor-pointer"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Profile details (shown always) */}
          <div className="lg:col-span-1 glassmorphic-card rounded-2xl p-6 relative overflow-hidden group shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-500"></div>
            
            <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-800/80">
              <div className="w-20 h-20 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center mb-4 relative">
                <User size={36} className="text-purple-400" />
                <span className="absolute bottom-0 right-0 bg-purple-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
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

          {/* Tab Pages */}
          <div className="lg:col-span-2 space-y-8">
            
            {activeTab === 'overview' && (
              <>
                <div className="glassmorphic-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
                    <ShieldCheck className="text-purple-400" size={20} />
                    <span>Global System Status</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Active Categories</span>
                        <Settings className="text-purple-400" size={16} />
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">{categories.length}</p>
                      <span className="text-[10px] text-zinc-500 block mt-1">For categorization</span>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Catalog Tests</span>
                        <LayoutGrid className="text-purple-400" size={16} />
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">{testsCount}</p>
                      <span className="text-[10px] text-zinc-500 block mt-1">In active DB catalog</span>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Database status</span>
                        <Database className="text-purple-400" size={16} />
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">Active</p>
                      <span className="text-[10px] text-zinc-500 block mt-1">MongoDB connection OK</span>
                    </div>
                  </div>
                </div>

                <div className="glassmorphic-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-zinc-100 mb-4">Admin Command Center</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    Use the navigation tabs above to manage the medical test catalog and categories. Updates made here are immediately applied to the public catalog browser and diagnostic booking configurations.
                  </p>
                  <div className="flex gap-4">
                    <Link
                      to="/tests"
                      className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition-all"
                    >
                      View Patient Catalog
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Test Catalog Tab */}
            {activeTab === 'tests' && (
              <div className="glassmorphic-card rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100">Diagnostic Test Catalog</h3>
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
                    <div className="w-8 h-8 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin"></div>
                  </div>
                ) : tests.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-sm">
                    No tests in the catalog database yet. Click "Add New Test" to begin.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
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
                            <td className="py-3.5 px-4 text-zinc-400 text-xs">
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
                                className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              {test.isActive !== false && (
                                <button
                                  onClick={() => handleTestDeactivate(test._id || '')}
                                  className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900/40 bg-zinc-900 text-zinc-400 hover:text-red-400 transition-colors"
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
                        className="px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900 text-xs font-semibold text-zinc-400 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setTestPage((p) => Math.min(p + 1, testPages))}
                        disabled={testPage === testPages}
                        className="px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900 text-xs font-semibold text-zinc-400 disabled:opacity-40"
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
                  <h3 className="text-lg font-bold text-zinc-100">Diagnostic Categories</h3>
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
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            {cat.description || 'No description provided'}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => openEditCategory(cat)}
                            className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleCategoryDelete(cat._id || '')}
                            className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900/40 bg-zinc-900 text-zinc-400 hover:text-red-400 transition-colors"
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
        </div>
      </main>

      {/* Category Creation / Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glassmorphic-card rounded-3xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-100 mb-6">
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
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
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
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 min-h-24 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
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
            <h3 className="text-lg font-bold text-zinc-100 mb-6">
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
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
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
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-450 text-sm focus:outline-none bg-zinc-950"
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
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 min-h-20 focus:outline-none resize-none"
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
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-450 text-sm focus:outline-none bg-zinc-950"
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
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
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
                    placeholder="e.g. 24 hours, 2 days"
                    className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Preparation Instructions
                </label>
                <textarea
                  value={testForm.preparationInstructions}
                  onChange={(e) => setTestForm({ ...testForm, preparationInstructions: e.target.value })}
                  placeholder="e.g. 12-hour fasting required. Do not drink coffee before."
                  className="w-full px-4 py-2.5 rounded-xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 min-h-20 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-350">
                  <input
                    type="checkbox"
                    checked={testForm.isHomeCollectionAvailable}
                    onChange={(e) => setTestForm({ ...testForm, isHomeCollectionAvailable: e.target.checked })}
                    className="w-4 h-4 rounded accent-purple-650 bg-zinc-950 border-zinc-800"
                  />
                  <span>Home sampling collection available</span>
                </label>

                {editingTest && (
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-355">
                    <input
                      type="checkbox"
                      checked={testForm.isActive}
                      onChange={(e) => setTestForm({ ...testForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded accent-purple-655 bg-zinc-950 border-zinc-800"
                    />
                    <span>Active in Patient Catalog</span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestModalOpen(false);
                    setEditingTest(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                >
                  {editingTest ? 'Save Changes' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
