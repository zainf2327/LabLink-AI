import React from 'react';
import { ShieldAlert, History, Lock, Eye } from 'lucide-react';

interface AccessLogEntry {
  viewedBy?: {
    name: string;
  };
  viewedAt: string | Date;
  role: string;
}

interface ReportDisclosureProps {
  variant: 'compact' | 'full';
  createdAt?: string | Date;
  lastViewedAt?: string | Date | null;
  accessLog?: AccessLogEntry[];
}

export const ReportDisclosure: React.FC<ReportDisclosureProps> = ({
  variant,
  createdAt,
  lastViewedAt,
  accessLog = [],
}) => {
  const generatedDate = createdAt ? new Date(createdAt).toLocaleString() : 'N/A';
  const accessedDate = lastViewedAt ? new Date(lastViewedAt).toLocaleString() : 'Never';

  // Filter access log to show only staff/admin view events
  const staffAccesses = accessLog.filter(
    (log) => log.role === 'staff' || log.role === 'admin'
  );

  if (variant === 'compact') {
    return (
      <div className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-2xl space-y-3 text-[11px] text-zinc-450">
        <div className="flex items-start gap-2.5">
          <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-zinc-300">Disclaimer:</span> This report is provided for informational purposes only. It is not a substitute for professional medical advice. Always consult your physician.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-zinc-800/40 text-zinc-500">
          <span className="flex items-center gap-1.5">
            <History size={11} />
            <span>Generated: {generatedDate}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock size={11} className="text-emerald-500/80" />
            <span>Securely encrypted connection</span>
          </span>
        </div>
      </div>
    );
  }

  // Full Variant (Redesigned as a Premium Audit & Security Hub)
  return (
    <div className="glassmorphic-card p-5 rounded-2xl border border-zinc-800 bg-white space-y-4 shadow-sm text-xs">
      <div className="flex items-center justify-between border-b border-zinc-850/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
            <Lock size={14} />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">Clinical Security & Access Log</span>
        </div>
        <span className="text-[9px] uppercase font-extrabold tracking-widest bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Secure
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
        <div className="space-y-1.5">
          <h5 className="font-bold text-zinc-300 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
            <History size={11} className="text-zinc-400" />
            <span>File Provenance</span>
          </h5>
          <div className="space-y-1 pl-4 text-zinc-500 font-medium">
            <p className="flex justify-between">
              <span>Generated:</span> 
              <span className="text-zinc-200">{generatedDate}</span>
            </p>
            <p className="flex justify-between">
              <span>Last Accessed:</span> 
              <span className="text-zinc-200">{accessedDate}</span>
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <h5 className="font-bold text-zinc-300 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
            <Lock size={11} className="text-zinc-400" />
            <span>Privacy &amp; Encryption</span>
          </h5>
          <div className="pl-4 space-y-1 text-zinc-500 font-medium">
            <p>Transmitted securely via TLS 1.3</p>
            <p className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Isolated to care-team scope
            </p>
          </div>
        </div>
      </div>

      {staffAccesses.length > 0 && (
        <div className="pt-3 border-t border-zinc-850/50 space-y-2">
          <h5 className="font-bold text-zinc-300 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
            <Eye size={12} className="text-brand-500" />
            <span>Care Team Access Transparency Log</span>
          </h5>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin pr-1">
            {staffAccesses.map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-955 border border-zinc-850 text-[10px] text-zinc-500 font-semibold"
              >
                <span>
                  Viewed by{' '}
                  <span className="font-bold text-zinc-200">
                    {log.viewedBy?.name || 'Authorized Staff'}
                  </span>{' '}
                  ({log.role})
                </span>
                <span className="text-zinc-400">{new Date(log.viewedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-zinc-850/40 text-center text-[9px] text-zinc-500 font-semibold tracking-wide flex items-center justify-center gap-1.5">
        <ShieldAlert size={10} className="text-zinc-400 animate-pulse" />
        <span>Clinical tracking information. Not a substitute for primary medical advice.</span>
      </div>
    </div>
  );
};

export default ReportDisclosure;
