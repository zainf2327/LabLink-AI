import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, Database, FileCheck, HelpCircle } from 'lucide-react';
import Logo from '../components/Logo';

export const PrivacyPolicy: React.FC = () => {
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
              <Shield size={12} /> Privacy & Security Commitment
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-text-muted font-bold">
              Last Updated: July 27, 2026 • Version 1.2
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-surface-elevated p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mb-4">
                <Lock size={16} />
              </div>
              <h3 className="text-xs font-black tracking-tight text-text-primary">HIPAA Audited Isolation</h3>
              <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-relaxed">
                Biomarker records are isolated inside secure vector storage schemas unique to each patient's identity.
              </p>
            </div>

            <div className="bg-surface-elevated p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-500 flex items-center justify-center mb-4">
                <Database size={16} />
              </div>
              <h3 className="text-xs font-black tracking-tight text-text-primary">Zero Training on Patient Data</h3>
              <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-relaxed">
                Our AI translation assistant scans your records purely in real-time. We never use your diagnostic reports to train LLM models.
              </p>
            </div>

            <div className="bg-surface-elevated p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                <FileCheck size={16} />
              </div>
              <h3 className="text-xs font-black tracking-tight text-text-primary">PCI-DSS Compliant Payments</h3>
              <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-relaxed">
                All checkout events are handled directly by Stripe. We do not store or process complete credit card details on our servers.
              </p>
            </div>
          </div>

          <hr className="border-border" />

          {/* Detailed sections */}
          <div className="space-y-8 text-xs text-text-secondary font-semibold leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base font-black text-text-primary tracking-tight">1. Information We Collect</h2>
              <p>
                We only collect information required to securely schedule and process clinical laboratory test results:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><span className="text-text-primary font-bold">Account Profile:</span> Name, email address, password, phone number, and physical address for home collection services.</li>
                <li><span className="text-text-primary font-bold">Biomarker & Diagnostic Logs:</span> Raw lab values, pathology metrics, and scanned PDF report data provided by partner laboratories.</li>
                <li><span className="text-text-primary font-bold">Transaction History:</span> Booking schedules, purchase amounts, and subscription status (managed via Stripe).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-text-primary tracking-tight">2. How We Safeguard Clinical Data</h2>
              <p>
                LabLink AI implements rigid physical and electronic protection frameworks. In compliance with the Health Insurance Portability and Accountability Act (HIPAA):
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All clinical report processing leverages AES-256 state encryption at rest and TLS 1.3 in transit.</li>
                <li>Our semantic search and RAG retrieval pipelines utilize <span className="text-text-primary font-bold">strict logical customer tenancy</span>, meaning search vector indexes are permanently segregated per-patient account.</li>
                <li>No automated scripts can pull reports across multiple user records, ensuring zero risk of horizontal privilege leakage.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-text-primary tracking-tight">3. Third-Party Data Processing</h2>
              <p>
                We share data with verified third parties only to provide our operations:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><span className="text-text-primary font-bold">Partner Clinical Labs:</span> Certified regional diagnostics firms that perform physical sample evaluation.</li>
                <li><span className="text-text-primary font-bold">Stripe:</span> Used exclusively for booking payments and recurring premium membership billing.</li>
                <li><span className="text-text-primary font-bold">Google Calendar:</span> Integrated at user request to sync home blood collection slots with personal calendars.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-text-primary tracking-tight">4. Your Regulatory Rights</h2>
              <p>
                Depending on your jurisdiction (such as HIPAA rules or GDPR guidelines), you possess the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Request access to the diagnostic records and AI logs linked to your profile.</li>
                <li>Request structural amendments to incorrect account metadata.</li>
                <li>Request the complete deletion of your clinical records (subject to clinical laboratory record retention laws, which typically mandate storing original lab metrics for a minimal period).</li>
              </ul>
            </section>

            <section className="p-5 rounded-2xl bg-surface-muted border border-border space-y-2.5">
              <h3 className="text-xs font-black text-text-primary flex items-center gap-1.5">
                <HelpCircle size={14} className="text-brand-500" /> Have questions about data handling?
              </h3>
              <p className="text-[11px] leading-relaxed text-text-muted">
                Our designated Data Protection and HIPAA Compliance team is available to address queries regarding your health logs. You can reach out directly to our support line at <span className="text-text-primary font-bold">dpo@lablinkai.net</span> or mail us at:
                <br />
                <span className="italic block mt-1.5 pl-2 border-l border-border">
                  LabLink AI Compliance Office<br />
                  100 Medical Center Parkway, Suite 400<br />
                  Boston, MA 02111
                </span>
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
