import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartHandshake, ArrowLeft, Heart, CheckCircle2, Award, ShieldAlert, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';

export const MedicalAdvisory: React.FC = () => {
  // Auto-scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const boardMembers = [
    {
      name: "Dr. Sarah Chen, MD",
      role: "Chief Medical Officer & Advisory Board Chair",
      specialty: "Clinical Pathology & Diagnostic Medicine",
      credentials: "MD from Johns Hopkins University | 15+ years overseeing clinical reference laboratory operations.",
      contribution: "Dr. Chen supervises prompt ground-truth frameworks and reviews AI report output mappings to ensure medical guidelines are correctly contextualized.",
      imageUrl: "Dr. Chen" // We will display a nice initials icon / custom avatar placeholder
    },
    {
      name: "Dr. Marcus Vance, PhD",
      role: "Board Member & Clinical Advisor",
      specialty: "Bioinformatics & Genomic Medicine",
      credentials: "PhD in Bioengineering from Stanford University | Former Lead Researcher in molecular diagnostics.",
      contribution: "Dr. Vance directs the validation of biomarker mapping metrics, verifying correct ranges and testing models against rare pathology scenarios.",
      imageUrl: "Dr. Vance"
    },
    {
      name: "Dr. Elena Rostova, MD, MS",
      role: "Board Member & AI Safety Advisor",
      specialty: "Endocrinology & Health Informatics",
      credentials: "MD from Harvard Medical School | MS in Biomedical Informatics from MIT.",
      contribution: "Dr. Rostova oversees clinical safety filters, medical disclaimer triggers, and auditing mechanisms that keep the AI Assistant safe and patient-centric.",
      imageUrl: "Dr. Rostova"
    }
  ];

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
          className="space-y-12"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-500 border border-brand-100 text-[10px] font-black uppercase tracking-wider">
              <HeartHandshake size={12} /> Clinical Oversight & Safety
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
              Medical Advisory Board
            </h1>
            <p className="text-sm text-text-secondary font-semibold max-w-xl">
              LabLink AI is guided by a multidisciplinary board of medical physicians, pathologists, and bioinformaticians. We ensure our AI tools translate clinical metrics safely, accurately, and responsibly.
            </p>
          </div>

          {/* Guidelines Section */}
          <div className="bg-surface-elevated rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-6">
            <h2 className="text-base font-black text-text-primary tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-brand-500" /> How We Guide AI Clinical Quality
            </h2>
            <p className="text-xs text-text-secondary font-semibold leading-relaxed">
              Large Language Models (LLMs) are exceptionally powerful at summarizing text, but they require expert clinical calibration to translate biochemical metrics safely. Our advisory board enforces three structural rules:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand-500 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={15} /> Grounded Prompts
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Prompt templates leverage evidence-based diagnostic protocols (such as ADA standards for HbA1c or AHA guidelines for lipids) rather than generic open-ended reasoning.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-accent-500 font-bold text-xs uppercase tracking-wider">
                  <Award size={15} /> ISO & Reference Calibration
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Our system aligns output categories strictly with ISO-certified lab reference tables. If a value falls outside standard standard limits, safety tags trigger clinical checkup suggestions.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                  <Heart size={15} /> Safety Restraints
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  The AI Assistant is structurally restricted from prescribing therapeutics, formulating diagnoses, or recommending drug dosage changes. Every output includes a non-negotiable medical disclaimer.
                </p>
              </div>
            </div>
          </div>

          {/* Board Members Cards */}
          <div className="space-y-6">
            <h2 className="text-base font-black text-text-primary tracking-tight">Board of Advisors</h2>
            
            <div className="space-y-6">
              {boardMembers.map((member, i) => (
                <div key={i} className="bg-surface-elevated border border-border rounded-3xl p-6 flex flex-col md:flex-row gap-6 shadow-sm hover:border-brand-500/30 transition-all duration-300">
                  {/* Avatar / Graphic placeholder */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                    <span className="text-lg font-black text-brand-500">
                      {member.name.split(' ')[1].replace(',', '')[0]}
                      {member.name.split(' ')[2] ? member.name.split(' ')[2][0] : ''}
                    </span>
                  </div>
                  
                  {/* Profile info */}
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-sm font-black text-text-primary tracking-tight">{member.name}</h3>
                      <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mt-0.5">{member.role}</p>
                      <p className="text-[11px] text-text-muted mt-1 font-semibold italic">{member.specialty}</p>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                      <span className="text-text-primary font-bold">Credentials:</span> {member.credentials}
                    </p>
                    <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                      <span className="text-text-primary font-bold">Role & Contribution:</span> {member.contribution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Disclaimer reminder panel */}
          <div className="p-6 rounded-3xl bg-danger-bg/40 border border-danger-border flex gap-4 text-xs text-text-secondary">
            <div className="w-8 h-8 rounded-lg bg-danger-bg text-danger-text flex items-center justify-center shrink-0 border border-danger-border">
              <ShieldAlert size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-danger-text uppercase tracking-wider text-[10px]">Medical Disclaimer Notice</h4>
              <p className="text-[11px] leading-relaxed font-semibold">
                LabLink AI does not practice medicine or issue prescriptions. All automated translation scripts are validated periodically by our board to match general reference materials, but individual clinical judgments must always be managed by your clinical provider.
              </p>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default MedicalAdvisory;
