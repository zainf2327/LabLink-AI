import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Check, 
  ShoppingCart, 
  Bot, 
  Calendar, 
  Database, 
  ShieldAlert, 
  X,
  ClipboardCheck,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  Plus
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import { catalogService } from '../services/catalog.service';
import type { Test } from '../services/catalog.service';

export const Landing: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items: cartItems, addItem, isInCart } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Custom scroll listener for navbar glassmorphism
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Card Animation Tracker for "Add to Cart" visual explosion
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);
  
  // AI Simulator State
  const [aiChatLogs, setAiChatLogs] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your LabLink AI Assistant. Select a sample query below to see how I scan, structure, and translate raw biochemical logs into clean insights.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number | null>(null);

  // Roadmap State
  const [activeStep, setActiveStep] = useState(0);

  // Fallback tests list if backend is offline or empty
  const fallbackTests: Test[] = [
    {
      _id: 'fb-1',
      name: 'Comprehensive Metabolic Panel (CMP)',
      description: 'Evaluates kidney and liver function, electrolyte and fluid balance, and blood glucose levels.',
      type: 'lab',
      categoryId: { _id: 'cat-1', name: 'General Health' },
      price: 49.00,
      duration: '24 Hours',
      isHomeCollectionAvailable: true
    },
    {
      _id: 'fb-2',
      name: 'HbA1c & Fasting Insulin Profile',
      description: 'Measures average blood sugar levels over the past 3 months and active insulin response.',
      type: 'lab',
      categoryId: { _id: 'cat-2', name: 'Diabetes' },
      price: 39.00,
      duration: '12 Hours',
      isHomeCollectionAvailable: true
    },
    {
      _id: 'fb-3',
      name: 'Full Body Radiology Scan (Ultrasound)',
      description: 'Non-invasive diagnostic ultrasound imaging covering abdominal organs and key vascular pathways.',
      type: 'radiology',
      categoryId: { _id: 'cat-3', name: 'Imaging' },
      price: 189.00,
      duration: '48 Hours',
      isHomeCollectionAvailable: false
    },
    {
      _id: 'fb-4',
      name: 'Complete Thyroid Panel (TSH, Free T3/T4)',
      description: 'Comprehensive screening of thyroid gland activity to identify hypo- or hyper-thyroidism.',
      type: 'lab',
      categoryId: { _id: 'cat-1', name: 'General Health' },
      price: 59.00,
      duration: '24 Hours',
      isHomeCollectionAvailable: true
    },
    {
      _id: 'fb-5',
      name: 'Cardiac Risk Marker (Lipid Panel & hs-CRP)',
      description: 'Assesses total cholesterol, HDL, LDL, triglycerides, and high-sensitivity C-reactive protein levels.',
      type: 'lab',
      categoryId: { _id: 'cat-4', name: 'Cardiology' },
      price: 69.00,
      duration: '24 Hours',
      isHomeCollectionAvailable: true
    }
  ];

  // Fetch tests from API on mount
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await catalogService.getTests({ limit: 10 });
        if (data && data.success && data.tests?.length > 0) {
          setTests(data.tests.filter(t => t.isActive !== false));
        } else {
          setTests(fallbackTests);
        }
      } catch (err) {
        console.warn('Backend connection failed. Using high-fidelity fallback tests for landing catalog.', err);
        setTests(fallbackTests);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  // Filter tests based on tab category and search term
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          test.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'lab') return test.type === 'lab' && matchesSearch;
    if (selectedCategory === 'radiology') return test.type === 'radiology' && matchesSearch;
    return matchesSearch;
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleAddToCart = (test: Test) => {
    addItem(test);
    setAnimatingCardId(test._id || null);
    showToast(`"${test.name}" successfully added to your booking list!`);
    
    setTimeout(() => {
      setAnimatingCardId(null);
    }, 1100);
  };

  // AI Assistant Chat Simulator Prompts
  const aiSimulations = [
    {
      prompt: "Explain my high HbA1c level of 6.7%",
      response: "An HbA1c level of 6.7% indicates that your average blood sugar level over the past 90 days is elevated, putting you in the Type 2 Diabetes range (standard threshold is >= 6.5%). This is typically associated with insulin resistance, where body cells resist insulin intake.\n\nSuggested Next Steps:\n1. Maintain a low-glycemic diet rich in fiber and lean proteins.\n2. Engage in moderate aerobic exercise (30 mins daily) to enhance insulin sensitivity.\n3. Schedule a consultation with your primary care provider to evaluate options."
    },
    {
      prompt: "Translate my lipid panel summary",
      response: "Your Lipid Panel reports a Total Cholesterol of 220 mg/dL (slightly high) and LDL ('bad cholesterol') of 145 mg/dL (borderline high). However, your HDL ('good cholesterol') is excellent at 60 mg/dL.\n\nInterpretation:\nWhile your HDL acts as a vascular protector, the elevated LDL increases the risk of arterial plaque buildup over time.\n\nSuggested Next Steps:\n1. Reduce saturated fats and trans fats from your diet.\n2. Incorporate omega-3 rich foods like walnuts or salmon.\n3. Re-test in 3 to 6 months to monitor progress."
    },
    {
      prompt: "What do low Vitamin D levels mean?",
      response: "Your Vitamin D level is reported at 18 ng/mL, which falls under the 'Deficient' classification (standard optimal range is 30 - 100 ng/mL).\n\nKey Impacts:\nVitamin D plays a critical role in calcium absorption, bone health, immune function regulation, and mood stability.\n\nSuggested Next Steps:\n1. Discuss dietary supplements (typically Vitamin D3) with a clinician.\n2. Get 10-15 minutes of direct morning sunlight exposure daily.\n3. Increase consumption of fortified dairy products, eggs, and mushrooms."
    }
  ];

  const handleSimulateAi = (index: number) => {
    if (isTyping || isScanning) return;
    
    setCurrentPromptIndex(index);
    const selected = aiSimulations[index];
    
    // Add user message
    setAiChatLogs(prev => [...prev, { sender: 'user', text: selected.prompt }]);
    setIsScanning(true);

    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false);
      setIsTyping(true);
      
      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);
        setAiChatLogs(prev => [...prev, { sender: 'ai', text: selected.response }]);
      }, 1200);
    }, 1100);
  };

  const clearAiSim = () => {
    setAiChatLogs([
      { sender: 'ai', text: 'Hello! I am your LabLink AI Assistant. Select a sample query below to see how I scan, structure, and translate raw biochemical logs into clean insights.' }
    ]);
    setCurrentPromptIndex(null);
    setIsScanning(false);
    setIsTyping(false);
  };

  // Steps data for roadmap
  const roadmapSteps = [
    {
      title: "1. Secure Booking",
      subtitle: "Choose from our extensive test menu or build custom packages. Secure checkout via Stripe.",
      icon: Calendar,
      detail: "Search over 150+ blood tests, radiology scans, and pathology screenings. Pay safely using modern payment interfaces and schedule a time slot that fits your calendar."
    },
    {
      title: "2. Home Sample Collection",
      subtitle: "Certified phlebotomists collect blood samples right at your doorstep.",
      icon: Stethoscope,
      detail: "No waiting rooms or commutes. A licensed nurse arrives at your home or office equipped with medical-grade materials, verifying details securely."
    },
    {
      title: "3. Lab Processing",
      subtitle: "Samples are processed at ISO-certified diagnostic laboratories.",
      icon: Database,
      detail: "Your biomarkers are run on clinical equipment under strict quality control. Standard clinical protocols are logged securely to ensure compliance and sample traceability."
    },
    {
      title: "4. AI Report Translation",
      subtitle: "Unlock smart insights. Translate medical jargon into plain English insights.",
      icon: Bot,
      detail: "Receive standardized diagnostic data alongside plain-text medical analysis explaining what every marker means, potential causes, dietary indicators, and formatted summaries."
    }
  ];

  // Stagger variants for the Hero titles
  const heroContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const heroItemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 14 } 
    }
  };

  return (
    <div className="min-h-screen bg-surface text-text-primary relative font-sans transition-colors duration-500 overflow-x-hidden">
      
      {/* Dynamic light decorative grids and flowing background elements */}
      <div className="absolute top-0 left-0 right-0 h-[800px] bg-gradient-to-b from-brand-50/70 via-transparent to-transparent pointer-events-none z-0"></div>
      
      {/* Slowly moving colored background orbs */}
      <div className="absolute top-[8%] left-[12%] w-[450px] h-[450px] bg-brand-400/5 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse [animation-duration:8s]"></div>
      <div className="absolute top-[22%] right-[10%] w-[550px] h-[550px] bg-accent-400/5 rounded-full blur-[160px] pointer-events-none z-0 animate-pulse [animation-duration:12s]"></div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 glassmorphic-card rounded-2xl p-4 border-l-4 border-l-brand-500 shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shrink-0 animate-bounce">
              <ShoppingCart size={15} />
            </div>
            <div>
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Global Cart</p>
              <p className="text-xs text-text-secondary font-semibold mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-text-disabled hover:text-text-secondary ml-auto cursor-pointer p-1">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Navbar (Scroll-Reactive) */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-surface/85 backdrop-blur-md border-b border-border shadow-lg shadow-brand-500/5' 
          : 'bg-transparent border-b border-transparent py-2'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="md" className="group-hover:scale-110 group-hover:rotate-3" />
            <div>
              <h1 className="text-lg font-black tracking-tight text-gradient-primary group-hover:opacity-90 transition-opacity">
                LabLink <span className="text-[9px] bg-brand-50 text-brand-500 border border-brand-100 px-2 py-0.5 rounded-full font-black ml-1 uppercase tracking-widest align-middle">AI</span>
              </h1>
            </div>
          </Link>

          {/* Nav Anchors - Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-text-muted">
            <a href="#catalog" className="hover:text-brand-500 transition-colors duration-150 relative group">
              Test Catalog
              <span className="absolute bottom-[-6px] left-0 w-0 h-0.5 bg-brand-500 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#ai-assistant" className="hover:text-brand-500 transition-colors duration-150 relative group">
              AI Assistant
              <span className="absolute bottom-[-6px] left-0 w-0 h-0.5 bg-brand-500 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#roadmap" className="hover:text-brand-500 transition-colors duration-150 relative group">
              How it Works
              <span className="absolute bottom-[-6px] left-0 w-0 h-0.5 bg-brand-500 transition-all duration-200 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            {cartItems.length > 0 && (
              <Link 
                to="/checkout" 
                className="relative p-2.5 rounded-xl border border-border bg-surface-elevated text-text-secondary hover:bg-surface-muted hover:text-brand-500 hover:border-brand-300 transition-all duration-200 shadow-sm"
                title="View booking items"
              >
                <ShoppingCart size={17} />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {cartItems.length}
                </span>
              </Link>
            )}

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'staff' ? '/staff/dashboard' : '/patient/dashboard'}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 active:scale-95 hover:shadow-brand-500/35 transition-all duration-200 flex items-center gap-1.5"
                >
                  Dashboard <ChevronRight size={13} />
                </Link>
                <button 
                  onClick={logout}
                  className="hidden sm:inline-block px-3 py-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-brand-500 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 active:scale-95 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 pb-20 md:pt-16 md:pb-28 px-6 overflow-hidden max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Copy */}
          <motion.div 
            variants={heroContainerVariants}
            initial="hidden"
            animate="show"
            className="lg:col-span-7 space-y-8"
          >
            {/* Promo Pill */}
            <motion.div 
              variants={heroItemVariants}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-500 text-[10px] font-black uppercase tracking-wider shadow-sm"
            >
              <Sparkles size={13} className="animate-pulse text-brand-500" />
              <span>Next-Gen Smart Clinical Diagnostics</span>
            </motion.div>

            {/* Split Title Animations for Spring Bounce */}
            <motion.h2 
              variants={heroItemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-text-primary"
            >
              Understand Your <br />
              <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500 bg-clip-text text-transparent drop-shadow-sm">Health Biomarkers</span> <br />
              Like Never Before.
            </motion.h2>

            <motion.p 
              variants={heroItemVariants}
              className="text-sm sm:text-base text-text-secondary max-w-xl font-medium leading-relaxed"
            >
              Book gold-standard diagnostic lab tests online, enjoy painless home sample collection, and translate complex laboratory reports into clear, actionable AI-powered health summaries.
            </motion.p>

            {/* Interactive Search & CTA Input */}
            <motion.div 
              variants={heroItemVariants}
              className="flex flex-col sm:flex-row gap-3 max-w-xl p-2 bg-surface-elevated shadow-xl shadow-brand-500/5 border border-border rounded-2xl"
            >
              <div className="relative flex-1">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text"
                  placeholder="Search CBC, Vitamin D, Thyroid panel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-transparent border-0 text-xs text-text-primary placeholder:text-text-muted outline-none focus:ring-0"
                />
              </div>
              <a 
                href="#catalog"
                className="px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20 active:scale-98 transition-all duration-150"
              >
                Browse Catalog <ArrowRight size={14} />
              </a>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div 
              variants={heroItemVariants}
              className="pt-6 grid grid-cols-3 gap-6 border-t border-border max-w-lg"
            >
              <div>
                <p className="text-2xl sm:text-3xl font-black text-brand-500 tracking-tight">99.8%</p>
                <p className="text-[10px] text-text-muted font-black uppercase mt-1">Lab Accuracy</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">150+</p>
                <p className="text-[10px] text-text-muted font-black uppercase mt-1">Biomarker Tests</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">2hr</p>
                <p className="text-[10px] text-text-muted font-black uppercase mt-1">Phlebotomy Slot</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Hero Graphic: Dynamic floating medical mockups */}
          <div className="lg:col-span-5 relative h-[480px] hidden lg:block">
            
            {/* Main Interactive Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.0, type: "spring", stiffness: 60 }}
              whileHover={{ y: -5, rotate: -0.5, boxShadow: "0 25px 50px -12px rgba(37,99,235,0.18)" }}
              className="absolute left-6 top-6 w-80 bg-surface-elevated border border-border shadow-2xl rounded-3xl p-6 z-10 cursor-pointer animate-float"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-brand-50 text-brand-500 border border-brand-100">
                  AI Analyzed Panel
                </span>
                <span className="text-[10px] text-text-muted font-bold">Live Status</span>
              </div>
              <h4 className="text-sm font-black text-text-primary leading-tight">Sarah Jenkins</h4>
              <p className="text-[10px] text-text-muted font-semibold mb-6">Patient ID: #LB-8827</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-text-secondary">Serum Vitamin D3</span>
                    <span className="text-danger-text font-black">18.2 ng/mL (Low)</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '45%' }}
                      transition={{ duration: 1.2, delay: 0.5 }}
                      className="h-full bg-danger-text rounded-full"
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-text-secondary">HbA1c Glycated Hgb</span>
                    <span className="text-amber-600 font-black">5.8% (Prediabetic)</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '62%' }}
                      transition={{ duration: 1.2, delay: 0.7 }}
                      className="h-full bg-amber-500 rounded-full"
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-text-secondary">Total Cholesterol</span>
                    <span className="text-brand-500 font-black">185 mg/dL (Optimal)</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '80%' }}
                      transition={{ duration: 1.2, delay: 0.9 }}
                      className="h-full bg-brand-500 rounded-full"
                    ></motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sub Floating Card (AI Insight bubble) */}
            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1.0, delay: 0.4, type: "spring", stiffness: 70 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="absolute right-0 bottom-12 w-64 bg-surface-elevated border border-border shadow-xl rounded-2xl p-4 animate-float-delayed z-20 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-sm">
                  <Bot size={13} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-500">AI Assistant</span>
              </div>
              <p className="text-xs text-text-secondary font-medium leading-relaxed">
                "Sarah, your low Vitamin D suggests introducing morning light (15 mins/day) and reviewing daily D3 supplementation."
              </p>
            </motion.div>

            {/* Glowing active pulse circle in background */}
            <div className="absolute left-[35%] top-[45%] w-24 h-24 bg-brand-500/10 rounded-full blur-xl animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Interactive Catalog Section */}
      <section id="catalog" className="py-20 bg-surface-elevated border-y border-border relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-brand-500 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">Lab Diagnostic Catalog</span>
            <h3 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">Browse Clinical Packages</h3>
            <p className="text-sm text-text-secondary font-semibold leading-relaxed">
              Select diagnostic biomarkers, check transparent pricing, and add to your test queue right now.
            </p>
          </div>

          {/* Filters and Search toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-border">
            {/* Tabs */}
            <div className="flex bg-surface-muted p-1.5 rounded-xl gap-1 w-full md:w-auto">
              {[
                { id: 'all', name: 'All Tests' },
                { id: 'lab', name: 'Diagnostic Lab' },
                { id: 'radiology', name: 'Radiology' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex-1 md:flex-none px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedCategory === tab.id 
                      ? 'bg-surface-elevated text-brand-500 shadow-md border border-border' 
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Inline search filter */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Grid Layout of tests with Scroll load animation */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <div className="w-9 h-9 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
              <p className="text-xs font-bold mt-4 animate-pulse">Loading diagnostic menu...</p>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-surface">
              <ShieldAlert className="mx-auto text-text-muted mb-3" size={36} />
              <h4 className="text-sm font-black text-text-secondary">No matching tests found</h4>
              <p className="text-xs text-text-muted mt-1">Try resetting the tab filters or checking your spelling.</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredTests.map((test) => {
                  const inCart = isInCart(test._id || '');
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      whileHover={{ 
                        y: -8, 
                        borderColor: "rgba(37, 99, 235, 0.3)",
                        boxShadow: "0 20px 40px -15px rgba(37, 99, 235, 0.12)" 
                      }}
                      transition={{ duration: 0.25 }}
                      key={test._id}
                      className="bg-surface rounded-2xl p-6 border border-border flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Floating Add to Cart Animation Banner */}
                      <AnimatePresence>
                        {animatingCardId === test._id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.6, y: 10 }}
                            animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.1, 1.2, 0.9], y: -45 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                          >
                            <div className="px-4 py-2 bg-brand-500 text-white rounded-full text-xs font-black shadow-lg shadow-brand-500/40 flex items-center gap-1.5 animate-pulse-ring">
                              <ShoppingCart size={13} /> Test Queued!
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div>
                        {/* Tags */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                            test.type === 'lab' 
                              ? 'bg-brand-50 text-brand-550 border border-brand-100' 
                              : 'bg-accent-50 text-accent-600 border border-accent-100'
                          }`}>
                            {test.type}
                          </span>
                          <span className="text-[10px] text-text-muted font-bold">
                            ⌛ {test.duration}
                          </span>
                        </div>

                        {/* Name and description */}
                        <h4 className="text-base font-black text-text-primary tracking-tight leading-snug line-clamp-1 group-hover:text-brand-500">
                          {test.name}
                        </h4>
                        <p className="text-xs text-text-muted font-semibold mt-2.5 leading-relaxed line-clamp-2 min-h-[36px]">
                          {test.description}
                        </p>
                      </div>

                      {/* Bottom values */}
                      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Price</p>
                          <p className="text-lg font-black text-text-primary mt-0.5">${test.price.toFixed(2)}</p>
                        </div>

                        {inCart ? (
                          <button
                            disabled
                            className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-surface-muted text-brand-500 border border-brand-100 flex items-center gap-1 cursor-not-allowed"
                          >
                            <Check size={13} /> Booked
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(test)}
                            className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/25 active:scale-95 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={13} /> Book Test
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Quick Info Banner with Scroll fade */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12 p-5 rounded-2xl bg-surface/60 border border-border text-center md:flex items-center justify-between gap-6 max-w-4xl mx-auto shadow-sm"
          >
            <div className="flex items-center justify-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                <ClipboardCheck size={20} />
              </div>
              <div className="text-left">
                <h5 className="text-xs font-bold text-text-primary">Need a Custom Diagnostic Package?</h5>
                <p className="text-[11px] text-text-secondary font-medium">Get matched with clinical panel builders to generate doctor referrals.</p>
              </div>
            </div>
            <Link 
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-500 hover:text-brand-600 transition-colors font-bold"
            >
              Sign up for free consult <ArrowRight size={13} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* AI Assistant Chat Simulator with Scanner laser effect */}
      <section id="ai-assistant" className="py-20 max-w-7xl mx-auto px-6 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Info Side */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-6"
          >
            <span className="text-xs font-black uppercase tracking-widest text-brand-500 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full">Interactive AI translation</span>
            <h3 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight leading-[1.15]">
              Decode Raw Lab Summaries Instantly
            </h3>
            <p className="text-sm text-text-secondary font-semibold leading-relaxed">
              Standard lab reports are difficult to decipher. LabLink AI integrates directly with your diagnostic panel outputs, translating complex scores into simple, structured explanations.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                  <Check size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Translates Jargon</h4>
                  <p className="text-[11px] text-text-muted mt-0.5">Explains complex biomarker abbreviations in plain English.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                  <Check size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Structured Recommendations</h4>
                  <p className="text-[11px] text-text-muted mt-0.5">Safely aligns findings with baseline thresholds.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                  <Check size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Strict Medical Disclaimer</h4>
                  <p className="text-[11px] text-text-muted mt-0.5">Always includes disclaimer flags to protect diagnostic safety.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Interactive Widget Box Side */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="glassmorphic-card rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col h-[540px] relative">
              
              {/* Animated Neon Laser Scan bar */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '95%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_20px_#2563eb] blur-[1px] z-30 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Widget Header */}
              <div className="px-6 py-4 bg-surface-elevated border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-white shadow-sm shadow-brand-500/10">
                    <Bot size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">LabLink AI Report Scanner</h4>
                    <p className="text-[9px] text-brand-500 font-black uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Translator Engine Active
                    </p>
                  </div>
                </div>

                <button 
                  onClick={clearAiSim}
                  className="px-3 py-1.5 rounded-lg border border-border hover:border-brand-300 bg-surface-elevated text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-brand-500 hover:shadow-sm transition-all cursor-pointer"
                >
                  Clear Screen
                </button>
              </div>

              {/* Chat Viewport with scan shade overlay */}
              <div className={`flex-1 p-6 overflow-y-auto space-y-4 bg-surface-muted/30 transition-all duration-300 ${isScanning ? 'brightness-[0.85]' : ''}`}>
                {aiChatLogs.map((log, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 15 }}
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${log.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {log.sender === 'ai' && (
                      <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border text-brand-500 flex items-center justify-center shrink-0 shadow-sm">
                        <Bot size={13} />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                      log.sender === 'user' 
                        ? 'bg-brand-500 text-white rounded-tr-none' 
                        : 'bg-surface-elevated border border-border text-text-secondary rounded-tl-none whitespace-pre-line'
                    }`}>
                      {log.text}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border text-brand-500 flex items-center justify-center shrink-0">
                      <Bot size={13} />
                    </div>
                    <div className="bg-surface-elevated border border-border text-text-muted p-4 rounded-2xl rounded-tl-none text-xs flex gap-1 items-center shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts Selector */}
              <div className="p-4 bg-surface-elevated border-t border-border space-y-3">
                <p className="text-[10px] text-text-muted font-black uppercase tracking-wider px-1">Select Biomarker Query to Scan:</p>
                <div className="flex flex-wrap gap-2">
                  {aiSimulations.map((sim, i) => (
                    <button
                      key={i}
                      disabled={isTyping || isScanning}
                      onClick={() => handleSimulateAi(i)}
                      className={`text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
                        currentPromptIndex === i 
                          ? 'bg-brand-50 text-brand-500 border-brand-300 shadow-sm' 
                          : 'bg-surface-muted border-border hover:border-brand-200 text-text-secondary hover:text-brand-500 hover:bg-surface-elevated'
                      } ${isTyping || isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {sim.prompt}
                    </button>
                  ))}
                </div>

                {/* MEDICAL DISCLAIMER - MANDATORY FOR RULE 7 COMPLIANCE */}
                <div className="pt-3 border-t border-border text-[9px] text-text-muted font-semibold leading-relaxed flex gap-2 items-start bg-brand-50/20 p-2 rounded-xl border border-brand-100/30">
                  <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <span>
                    <strong>Advisory Disclaimer:</strong> LabLink AI provides educational summaries translating medical report logs. This is not clinical diagnosis, treatment prescription, or official clinical advice. Always consult a physician for official medical review.
                  </span>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Roadmap / How It Works */}
      <section id="roadmap" className="py-20 bg-surface-elevated border-t border-border relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-brand-500 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">Direct Patient Workflow</span>
            <h3 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">How LabLink Works</h3>
            <p className="text-sm text-text-secondary font-semibold leading-relaxed">
              We streamline clinical diagnostic operations from your screen directly to certified laboratory reports.
            </p>
          </div>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Step Selection Buttons (Col span 5) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 flex flex-col justify-between gap-4"
            >
              {roadmapSteps.map((step, i) => {
                const IconComp = step.icon;
                const isActive = activeStep === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`w-full text-left p-5 rounded-2xl transition-all duration-250 flex items-start gap-4 border cursor-pointer ${
                      isActive 
                        ? 'bg-surface border-brand-500/35 shadow-lg shadow-brand-500/5' 
                        : 'bg-surface-elevated border-border hover:bg-surface-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors duration-200 ${
                      isActive ? 'bg-brand-500 text-white' : 'bg-surface-muted text-text-muted'
                    }`}>
                      <IconComp size={18} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-black tracking-tight ${isActive ? 'text-brand-500' : 'text-text-primary'}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-text-muted font-semibold mt-1 leading-normal line-clamp-1">
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </motion.div>

            {/* Step Detail Card (Col span 7) with dynamic tab switching animation */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <div className="bg-surface rounded-3xl p-8 border border-border h-full flex flex-col justify-between relative overflow-hidden shadow-sm">
                
                {/* Large Background watermark number */}
                <div className="absolute right-0 bottom-0 text-[180px] font-black text-surface-muted/50 leading-none select-none pointer-events-none -mr-8 -mb-10">
                  {activeStep + 1}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeStep}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="relative z-10 space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-xs font-black">
                        {activeStep + 1}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">Step Detail</span>
                    </div>

                    <h3 className="text-2xl font-black text-text-primary tracking-tight">
                      {roadmapSteps[activeStep].title}
                    </h3>
                    
                    <p className="text-xs text-text-secondary font-bold leading-relaxed max-w-xl">
                      {roadmapSteps[activeStep].subtitle}
                    </p>

                    <div className="p-5 rounded-2xl bg-surface-elevated border border-border text-xs text-text-secondary leading-relaxed font-semibold shadow-sm">
                      {roadmapSteps[activeStep].detail}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="relative z-10 pt-8 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-black uppercase tracking-wider">Step {activeStep + 1} of 4</span>
                  
                  <div className="flex gap-2">
                    {activeStep > 0 && (
                      <button 
                        onClick={() => setActiveStep(prev => prev - 1)}
                        className="px-3.5 py-2 rounded-lg bg-surface-elevated hover:bg-surface-muted text-text-secondary hover:text-brand-500 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-border"
                      >
                        <ChevronLeft size={13} /> Back
                      </button>
                    )}

                    {activeStep < 3 ? (
                      <button 
                        onClick={() => setActiveStep(prev => prev + 1)}
                        className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-muted text-text-secondary hover:text-brand-500 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-border"
                      >
                        Next Step <ChevronRight size={13} />
                      </button>
                    ) : (
                      <Link 
                        to="/register"
                        className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-500/25 active:scale-95 transition-all flex items-center gap-1.5 font-bold"
                      >
                        Book Online Now <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CTA Card Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 text-center z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-surface-elevated rounded-3xl p-12 border border-border relative overflow-hidden max-w-4xl mx-auto shadow-2xl"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-brand-500">Take Control of Your Health</span>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight leading-tight">
              Ready to decode your laboratory biomarker results?
            </h2>
            <p className="text-sm text-text-secondary font-semibold leading-relaxed max-w-lg mx-auto">
              Join thousands of patients who use LabLink to schedule clinical test collection visits and understand reports clearly.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 transition-all font-bold"
              >
                Create Free Account
              </Link>
              <a 
                href="#catalog"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surface-muted hover:bg-surface-elevated border border-border text-text-secondary hover:text-brand-500 font-bold text-xs uppercase tracking-wider transition-all font-bold"
              >
                Explore Test Prices
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Standard Clean Footer */}
      <footer className="border-t border-border bg-surface-elevated py-12 text-text-muted text-xs font-semibold relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" animate={false} />
              <span className="text-base font-black text-text-primary tracking-tight">LabLink AI</span>
            </div>
            <p className="text-[11px] text-text-muted font-semibold leading-relaxed">
              Safe, secure, and modern digital diagnostic clinical operations powered by laboratory biomarker insights.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Patient Portal</h5>
            <ul className="space-y-2.5">
              <li><Link to="/login" className="hover:text-brand-500 transition-colors">Sign in to account</Link></li>
              <li><Link to="/register" className="hover:text-brand-500 transition-colors">Create new account</Link></li>
              <li><a href="#catalog" className="hover:text-brand-500 transition-colors">Lab diagnostic tests</a></li>
              <li><Link to="/tests" className="hover:text-brand-500 transition-colors">Search pricing list</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Clinic Operations</h5>
            <ul className="space-y-2.5">
              <li><span className="text-text-muted">Phlebotomy Team:</span> 8am - 8pm</li>
              <li><span className="text-text-muted">Lab Processing:</span> 24/7 Hours</li>
              <li><span className="text-text-muted">Support Email:</span> support@lablinkai.net</li>
              <li><span className="text-text-muted">Phone Support:</span> +1 (555) 720-4357</li>
            </ul>
          </div>

          {/* Compliances */}
          <div>
            <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Regulatory & Safety</h5>
            <ul className="space-y-2.5 text-[11px] text-text-muted leading-normal font-semibold">
              <li>ISO 15189 Certified labs</li>
              <li>Stripe PCI-DSS Compliant Payments</li>
              <li>Direct secure HIPAA vector analytics</li>
              <li>All vectors isolated per patient</li>
            </ul>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-text-disabled font-semibold text-[11px] gap-4">
          <p>© {new Date().getFullYear()} LabLink AI. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-text-secondary cursor-pointer">Privacy Policy</span>
            <span className="hover:text-text-secondary cursor-pointer">Terms of Service</span>
            <span className="hover:text-text-secondary cursor-pointer">Medical Advisory Board</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
