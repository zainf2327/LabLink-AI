import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertBannerProps {
  message: string;
  variant: AlertVariant;
  onClose?: () => void;
  className?: string;
}

const VARIANT_CONFIG = {
  success: {
    Icon: CheckCircle2,
    iconStyle: { color: '#059669' }, // emerald-600
    containerClass: 'bg-emerald-50 border-emerald-500 border-l-4 shadow-sm',
    textStyle: { color: '#064e3b' }, // emerald-900
  },
  error: {
    Icon: XCircle,
    iconStyle: { color: '#dc2626' }, // red-600
    containerClass: 'bg-red-50 border-red-500 border-l-4 shadow-sm',
    textStyle: { color: '#7f1d1d' }, // red-900
  },
  warning: {
    Icon: AlertTriangle,
    iconStyle: { color: '#d97706' }, // amber-600
    containerClass: 'bg-amber-50 border-amber-500 border-l-4 shadow-sm',
    textStyle: { color: '#78350f' }, // amber-900
  },
  info: {
    Icon: Info,
    iconStyle: { color: '#2563eb' }, // blue-600
    containerClass: 'bg-blue-50 border-blue-500 border-l-4 shadow-sm',
    textStyle: { color: '#0c4a6e' }, // blue-900
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  message,
  variant,
  onClose,
  className = '',
}) => {
  const config = VARIANT_CONFIG[variant];
  const { Icon } = config;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl transition-all duration-300 font-sans ${config.containerClass} ${className}`}
      role="alert"
    >
      <Icon size={18} className="shrink-0 mt-0.5" style={config.iconStyle} />
      
      <div 
        className="flex-1 text-xs sm:text-sm font-extrabold tracking-tight leading-snug"
        style={config.textStyle}
      >
        {message}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-0.5 rounded-lg transition-colors cursor-pointer"
          style={config.iconStyle}
          aria-label="Dismiss alert"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
