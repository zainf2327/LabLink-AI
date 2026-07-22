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

  // Full Variant
  return (
    <div className="glassmorphic-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/20 space-y-5 text-xs text-zinc-350">
      <div className="flex items-start gap-3">
        <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-zinc-100">Medical Advice Disclaimer</h4>
          <p className="leading-relaxed text-zinc-405 text-[11px]">
            The contents of this diagnostic report are provided for informational and clinical tracking purposes. This report is not a substitute for direct professional medical advice, diagnosis, or treatment. Please discuss all lab results and clinical findings with your consulting physician.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-850/50 text-[11px] text-zinc-450">
        <div className="space-y-2">
          <h5 className="font-bold text-zinc-300 uppercase tracking-wider text-[9px]">File Provenance</h5>
          <div className="space-y-1.5 text-zinc-500">
            <p className="flex items-center gap-1.5">
              <span className="text-zinc-650 font-medium">Generated:</span> {generatedDate}
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-zinc-650 font-medium">Last Access:</span> {accessedDate}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-bold text-zinc-300 uppercase tracking-wider text-[9px]">Privacy &amp; Security</h5>
          <p className="flex items-center gap-1.5 text-zinc-500">
            <Lock size={12} className="text-emerald-500 shrink-0" />
            <span>Transmitted securely &bull; care-team isolated</span>
          </p>
        </div>
      </div>

      {staffAccesses.length > 0 && (
        <div className="pt-4 border-t border-zinc-850/50 space-y-2.5">
          <h5 className="font-bold text-zinc-300 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
            <Eye size={12} className="text-purple-400" />
            <span>Care Team Access Transparency Log</span>
          </h5>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin pr-1">
            {staffAccesses.map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-900/60 text-[10px] text-zinc-500"
              >
                <span>
                  Viewed by{' '}
                  <span className="font-bold text-zinc-300">
                    {log.viewedBy?.name || 'Authorized Staff'}
                  </span>{' '}
                  ({log.role})
                </span>
                <span>{new Date(log.viewedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDisclosure;
