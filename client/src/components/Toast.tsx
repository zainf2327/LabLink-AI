import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number; // ms
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    Icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
    iconStyle: React.CSSProperties;
    containerClass: string;
    textStyle: React.CSSProperties;
  }
> = {
  success: {
    Icon: CheckCircle2,
    iconStyle: { color: '#059669' }, // emerald-600
    containerClass: 'bg-emerald-50 border-emerald-500 border-l-4 shadow-md',
    textStyle: { color: '#064e3b' }, // emerald-900
  },
  error: {
    Icon: XCircle,
    iconStyle: { color: '#dc2626' }, // red-600
    containerClass: 'bg-red-50 border-red-500 border-l-4 shadow-md',
    textStyle: { color: '#7f1d1d' }, // red-900
  },
  warning: {
    Icon: AlertTriangle,
    iconStyle: { color: '#d97706' }, // amber-600
    containerClass: 'bg-amber-50 border-amber-500 border-l-4 shadow-md',
    textStyle: { color: '#78350f' }, // amber-900
  },
  info: {
    Icon: Info,
    iconStyle: { color: '#2563eb' }, // blue-600
    containerClass: 'bg-blue-50 border-blue-500 border-l-4 shadow-md',
    textStyle: { color: '#0c4a6e' }, // blue-900
  },
};

// ─── ToastItem ────────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = VARIANT_CONFIG[toast.variant];
  const { Icon } = config;

  const triggerDismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 350);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    // Slide in
    const enterTimeout = setTimeout(() => setVisible(true), 10);

    // Auto-dismiss
    timeoutRef.current = setTimeout(() => {
      triggerDismiss();
    }, toast.duration);

    return () => {
      clearTimeout(enterTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [toast.duration, triggerDismiss]);

  return (
    <div
      className={`
        relative flex items-start gap-3 w-full max-w-sm rounded-xl px-4.5 py-4 shadow-lg
        border border-slate-200/40 overflow-hidden
        transition-all duration-350 ease-out
        ${config.containerClass}
        ${visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
        ${leaving ? 'opacity-0 translate-x-8' : ''}
      `}
      style={{ transition: 'opacity 350ms ease, transform 350ms ease' }}
    >
      {/* Icon */}
      <Icon size={18} className="shrink-0 mt-0.5" style={config.iconStyle} />

      {/* Message */}
      <p 
        className="text-xs sm:text-sm font-extrabold leading-snug flex-1 pr-1 font-sans"
        style={config.textStyle}
      >
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={triggerDismiss}
        className="shrink-0 p-0.5 rounded-lg transition-colors cursor-pointer"
        style={config.iconStyle}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ─── ToastContainer ───────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

// ─── ToastProvider ────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, variant: ToastVariant, duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const resolvedDuration = duration ?? DEFAULT_DURATIONS[variant];
      setToasts((prev) => [...prev, { id, message, variant, duration: resolvedDuration }]);
    },
    []
  );

  const value: ToastContextValue = {
    success: (msg, dur) => add(msg, 'success', dur),
    error: (msg, dur) => add(msg, 'error', dur),
    warning: (msg, dur) => add(msg, 'warning', dur),
    info: (msg, dur) => add(msg, 'info', dur),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};
