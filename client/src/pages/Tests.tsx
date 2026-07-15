import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import { catalogService } from '../services/catalog.service';
import type { Category, Test } from '../services/catalog.service';
import { Search, SlidersHorizontal, Home, ShieldAlert, FileText, ChevronRight, X, CalendarCheck2, ArrowLeft, ShoppingCart } from 'lucide-react';

export const Tests: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lab' | 'radiology'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [bookingFeedback, setBookingFeedback] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const catRes = await catalogService.getCategories();
      if (catRes.success) {
        setCategories(catRes.categories);
      }

      // Fetch tests with filters
      const testRes = await catalogService.getTests({
        page,
        limit: 9,
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        type: selectedType === 'all' ? undefined : selectedType,
      });

      if (testRes.success) {
        setTests(testRes.tests);
        setTotalPages(testRes.pages);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedType]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleTypeChange = (type: 'all' | 'lab' | 'radiology') => {
    setSelectedType(type);
    setPage(1);
  };

  const { addItem, removeItem, isInCart, items: cartItems } = useCartStore();

  const handleBookClick = (test: Test) => {
    if (!isAuthenticated) {
      // Redirect guest to login
      navigate('/login');
    } else {
      if (isInCart(test._id || '')) {
        removeItem(test._id || '');
        setBookingFeedback(`Removed "${test.name}" from cart`);
      } else {
        addItem(test);
        setBookingFeedback(`Added "${test.name}" to cart!`);
      }
      setTimeout(() => {
        setBookingFeedback(null);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-pattern text-zinc-100 flex flex-col">
      {/* Header / Navbar */}
      <nav className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg">
                <span className="font-extrabold text-black text-lg">LL</span>
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  LabLink AI
                </span>
                <span className="text-zinc-500 text-xs block -mt-1">Medical Catalog</span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'staff' ? '/staff/dashboard' : '/patient/dashboard'}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 hover:text-emerald-400 transition-all duration-200"
                >
                  <ArrowLeft size={16} />
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-all duration-200"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Booking Alert Feedback */}
      {bookingFeedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="glassmorphic-card border-emerald-500/50 p-4 rounded-2xl flex gap-3 items-center shadow-2xl animate-bounce">
            <CalendarCheck2 size={24} className="text-emerald-400 shrink-0" />
            <div className="text-sm font-medium text-emerald-300">{bookingFeedback}</div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
          <div className="glassmorphic-card rounded-2xl p-5 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-emerald-400" />
              <span>Filters</span>
            </h3>

            {/* Type Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Service Type</span>
              <div className="flex flex-col gap-1.5">
                {(['all', 'lab', 'radiology'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                      selectedType === t
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    {t === 'all' ? 'All Services' : t === 'lab' ? 'Lab Tests' : 'Radiology Scans'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Category</span>
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === ''
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => handleCategoryChange(cat._id || '')}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 truncate ${
                      selectedCategory === cat._id
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                    title={cat.name}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Catalog Grid */}
        <section className="flex-1 flex flex-col gap-6">
          {/* Search bar */}
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search size={20} />
            </span>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search tests by name (e.g. CBC, Lipid, Blood...)"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl glassmorphic-input text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none"
            />
          </div>

          {/* Catalog Cards */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
              </div>
              <span className="mt-4 text-zinc-500 text-sm">Searching test database...</span>
            </div>
          ) : tests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 glassmorphic-card rounded-3xl p-8 text-center">
              <ShieldAlert className="text-zinc-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-zinc-300">No Tests Found</h3>
              <p className="text-zinc-500 text-sm mt-1 max-w-xs">
                We couldn't find any active tests matching your search filters. Try adjusting your query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <div
                  key={test._id}
                  className="glassmorphic-card rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all duration-300 relative group overflow-hidden"
                >
                  {/* Subtle top accent gradient */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

                  <div>
                    {/* Tags */}
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        test.type === 'lab'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {test.type === 'lab' ? 'Lab' : 'Radiology'}
                      </span>
                      {test.isHomeCollectionAvailable && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Home size={10} />
                          <span>Home Collection</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {test.name}
                    </h4>
                    <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Price</span>
                      <strong className="text-lg font-extrabold text-emerald-400">${test.price.toFixed(2)}</strong>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTest(test)}
                        className="px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-semibold"
                        title="View details"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleBookClick(test)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isInCart(test._id || '')
                            ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/20'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10'
                        }`}
                      >
                        <span>{isInCart(test._id || '') ? 'Added' : 'Book'}</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-400 disabled:opacity-40 disabled:pointer-events-none hover:text-emerald-400 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-zinc-500">
                Page <strong className="text-zinc-300">{page}</strong> of <strong className="text-zinc-300">{totalPages}</strong>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-400 disabled:opacity-40 disabled:pointer-events-none hover:text-emerald-400 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Test Detail Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glassmorphic-card rounded-3xl p-6 relative shadow-2xl border-zinc-700/50">
            <button
              onClick={() => setSelectedTest(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex gap-2 items-center mb-4">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                selectedTest.type === 'lab'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}>
                {selectedTest.type === 'lab' ? 'Lab Test' : 'Radiology Scan'}
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                Turnaround: {selectedTest.duration}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-zinc-100 pr-8">{selectedTest.name}</h3>
            
            {/* Category */}
            <p className="text-zinc-500 text-xs font-semibold mt-1">
              Category:{' '}
              <span className="text-zinc-300 font-medium">
                {typeof selectedTest.categoryId === 'object' ? selectedTest.categoryId.name : 'Unassigned'}
              </span>
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">Description</span>
                <p className="text-zinc-300 text-sm leading-relaxed">{selectedTest.description}</p>
              </div>

              {selectedTest.preparationInstructions && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">Preparation Instructions</span>
                  <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl">
                    {selectedTest.preparationInstructions}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-6 justify-between pt-4 border-t border-zinc-900 mt-6">
                <div>
                  <span className="text-xs text-zinc-500 block">Total Price</span>
                  <strong className="text-xl font-extrabold text-emerald-400">${selectedTest.price.toFixed(2)}</strong>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedTest(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-sm font-semibold text-zinc-300 hover:text-zinc-100 transition-all duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const t = selectedTest;
                      setSelectedTest(null);
                      handleBookClick(t);
                    }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                      isInCart(selectedTest._id || '')
                        ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/20'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20'
                    }`}
                  >
                    {isInCart(selectedTest._id || '') ? 'Added to Cart' : 'Book Diagnostic'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Widget */}
      {isAuthenticated && cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div className="glassmorphic-card border-emerald-500/30 p-4 rounded-2xl flex items-center gap-6 shadow-2xl bg-zinc-900/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 relative">
                <ShoppingCart size={18} />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold flex items-center justify-center">
                  {cartItems.length}
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block font-medium">Selected Tests</span>
                <strong className="text-sm font-extrabold text-emerald-400">
                  ${cartItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                </strong>
              </div>
            </div>
            <Link
              to="/checkout"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all flex items-center gap-1"
            >
              <span>Checkout</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900/80 bg-zinc-950 py-8 text-center text-xs text-zinc-600 uppercase tracking-wider mt-auto">
        All AI insights require medical practitioner sign-off. LabLink AI Diagnostics v1.0.0.
      </footer>
    </div>
  );
};

export default Tests;
