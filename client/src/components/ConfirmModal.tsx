import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  isSubmitting?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="p-5 border-b border-zinc-850 flex justify-between items-center bg-zinc-950/40">
          <h3 className="text-sm font-bold text-zinc-150 flex items-center gap-2">
            <AlertTriangle className={isDanger ? 'text-rose-500' : 'text-amber-500'} size={16} />
            <span>{title}</span>
          </h3>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-30"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-zinc-400 leading-relaxed">{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-950/20 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-zinc-850 text-zinc-400 hover:bg-zinc-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-30"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10'
            }`}
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin inline-block" />
            )}
            <span>{isSubmitting ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
