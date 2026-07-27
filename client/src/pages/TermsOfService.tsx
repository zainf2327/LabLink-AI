import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, ShieldAlert, CreditCard, Scale, HelpCircle } from 'lucide-react';
import Logo from '../components/Logo';

export const TermsOfService: React.FC = () => {
  // Auto-scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text-primary relative font-sans transition-colors duration-500 pb-20">
      {/* Background grid pattern & decorative orbs */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-brand-50/50 via-transparent to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-brand-400/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[5%] w-[350px] h-[350px] bg-accent-400/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Floating navigation header */}
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="sm" className="group-hover:scale-105 transition-transform" />
            <span className="text-sm font-black text-gradient-primary">LabLink AI</span>
          </Link>
          <Link 
            to="/" 
            className="px-3.5 py-1.5 rounded-xl border border-border bg-surface-elevated text-text-secondary hover:bg-surface-muted hover:text-brand-500 transition-all text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 pt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-10"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-500 border border-brand-100 text-[10px] font-black uppercase tracking-wider">
              <FileText size={12} /> Standard Operations Agreement
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-text-muted font-bold">
              Last Updated: July 27, 2026 • Version 1.2
            </p>
          </div>

          {/* CRITICAL MEDICAL DISCLAIMER CALLOUT */}
          <div className="bg-danger-bg/40 border border-danger-border p-6 rounded-2xl shadow-sm flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-danger-bg text-danger-text flex items-center justify-center shrink-0 border border-danger-border">
              <ShieldAlert size={20} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-black tracking-tight text-danger-text uppercase">Critical Medical Disclaimer</h3>
              <p className="text-[11px] text-text-secondary font-semibold leading-relaxed">
                LabLink AI provides diagnostic booking capabilities and AI-driven biomarker translation logs for informational purposes only. The translated reports are NOT diagnostic findings, medical guidance, or a replacement for clinical consulting. Always consult a licensed medical professional or physician regarding active symptoms, health complications, or test result treatments. Never delay seeking professional guidance due to information scanned on this platform.
              </p>
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-surface-elevated p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mb-4">
                <CreditCard size={16} />
              </div>
              <h3 className="text-xs font-black tracking-tight text-text-primary">Stripe Billing Security</h3>
              <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-relaxed">
                Fees for bookings, home collection visits, and monthly premium membership subscriptions are handled securely via Stripe. Payments are non-refundable once sample processing has commenced.
              </p>
            </div>

            <div className="bg-surface-elevated p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-500 flex items-center justify-center mb-4">
                <Scale size={16} />
              </div>
              <h3 className="text-xs font-black tracking-tight text-text-primary">Operational Compliance</h3>
              <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-relaxed">
                Users are responsible for ensuring that address details provided for home diagnostic collections are accurate, accessible, and safe for clinical personnel.
              </p>
            </div>
          </div>

          <hr className="border-border" />

          {/* Detailed sections */}
          <div className="space-y-8 text-xs text-text-secondary font-semibold leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base font-black text-text-primary tracking-tight">1. Services and Scheduling</h2>
              <p>
                LabLink AI operates a digital logistics platform linking patients to third-party clinical laboratories. We offer:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Catalog search and booking for standardized biomarkers, imaging scans, and pathology evaluations.</li>
                <li>Home phlebotomy collection coordination through licensed mobile phlebotomists.</li>
                <li>Real-time laboratory data structuring and AI-assisted plain-language summaries.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-text-primary tracking-tight">2. Account Registration and Account Safety</h2>
              <p>
                To schedule diagnostic assessments or review AI-translated logs, you must establish a personal profile. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Provide accurate, current, and complete contact credentials during onboarding.</li>
                <li>Maintain the confidentiality of your account credentials (passwords and email links).</li>
                <li>Promptly notify support if you discover any unauthorized access to your account.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-text-primary tracking-tight">3. Billing, Payments, and Memberships</h2>
              <p>
                By booking a service or purchasing a premium plan, you authorize LabLink AI to charge the payment method provided through our secure processing system (Stripe):
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><span className="text-text-primary font-bold">Cancellation Policy:</span> Bookings may be cancelled or rescheduled up to 24 hours prior to the scheduled home collection appointment. Within 24 hours, a service fee may apply.</li>
                <li><span className="text-text-primary font-bold">Premium Memberships:</span> Subscriptions are billed automatically on a recurring monthly or annual basis. You can cancel your subscription at any time within your Account Settings to prevent future charges.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-text-primary tracking-tight">4. Prohibited Platform Activities</h2>
              <p>
                Users are strictly prohibited from:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Uploading malicious payloads, corrupted files, or fake clinical report logs.</li>
                <li>Attempting to bypass security barriers or horizontal access controls separating user directories.</li>
                <li>Using the AI Assistant outputs to engage in self-treatment without professional consultation.</li>
              </ul>
            </section>

            <section className="p-5 rounded-2xl bg-surface-muted border border-border space-y-2.5">
              <h3 className="text-xs font-black text-text-primary flex items-center gap-1.5">
                <HelpCircle size={14} className="text-brand-500" /> Need clarification on our terms?
              </h3>
              <p className="text-[11px] leading-relaxed text-text-muted">
                Our support team is available to assist you with scheduling queries, membership questions, and general clinical protocols. Reach out to us at <span className="text-text-primary font-bold">legal@lablinkai.net</span> or call our customer service center at +1 (555) 720-4357.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TermsOfService;
