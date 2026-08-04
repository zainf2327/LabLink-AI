import React, { useState } from 'react';
import { AlertTriangle, Info, Trash2, Loader } from 'lucide-react';
import { useConfirm } from '../hooks/useConfirm';

const CONFIG = {
  danger: {
    Icon: Trash2,
    iconClass: 'text-red-500',
    bgIconClass: 'bg-red-500/10 border-red-500/20',
    btnClass: 'bg-red-600 hover:bg-red-500 text-white',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bgIconClass: 'bg-amber-500/10 border-amber-500/20',
    btnClass: 'bg-purple-600 hover:bg-purple-500 text-white',
  },
  info: {
    Icon: Info,
    iconClass: 'text-blue-500',
    bgIconClass: 'bg-blue-500/10 border-blue-500/20',
    btnClass: 'bg-blue-600 hover:bg-blue-500 text-white',
  },
};

export const ConfirmModal: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { isOpen, title, message, variant, onConfirm, cancel } = useConfirm();

  if (!isOpen) return null;

  const config = CONFIG[variant] || CONFIG.warning;
  const { Icon } = config;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error('Error executing confirm callback:', err);
    } finally {
      setLoading(false);
      cancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-6 p-4 bg-black/5 backdrop-blur-[1.5px] transition-all duration-300 animate-fadeIn">
      <div className="w-full max-w-md glassmorphic-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950/95 shadow-2xl relative flex flex-col gap-5 animate-scaleIn pointer-events-auto">
        <div className="flex gap-4 items-start">
          <div className={`w-10 h-10 ${config.bgIconClass} border rounded-full flex items-center justify-center shrink-0`}>
            <Icon className={config.iconClass} size={18} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-zinc-100 mb-1.5 font-sans">
              {title}
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end border-t border-zinc-850 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={cancel}
            className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${config.btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && <Loader size={12} className="animate-spin" />}
            <span>{loading ? 'Processing...' : 'Confirm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
