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
    Icon: React.FC<{ size?: number; className?: string }>;
    iconClass: string;
    borderClass: string;
    bgClass: string;
    progressClass: string;
  }
> = {
  success: {
    Icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/25',
    bgClass: 'bg-emerald-500/5',
    progressClass: 'bg-emerald-500',
  },
  error: {
    Icon: XCircle,
    iconClass: 'text-red-400',
    borderClass: 'border-red-500/25',
    bgClass: 'bg-red-500/5',
    progressClass: 'bg-red-500',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'text-amber-400',
    borderClass: 'border-amber-500/25',
    bgClass: 'bg-amber-500/5',
    progressClass: 'bg-amber-500',
  },
  info: {
    Icon: Info,
    iconClass: 'text-blue-400',
    borderClass: 'border-blue-500/25',
    bgClass: 'bg-blue-500/5',
    progressClass: 'bg-blue-500',
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
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = VARIANT_CONFIG[toast.variant];
  const { Icon } = config;

  const triggerDismiss = useCallback(() => {
    setLeaving(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => onDismiss(toast.id), 350);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    // Slide in
    const enterTimeout = setTimeout(() => setVisible(true), 10);

    // Progress bar countdown
    const step = 100 / (toast.duration / 100);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return next;
      });
    }, 100);

    // Auto-dismiss
    timeoutRef.current = setTimeout(() => {
      triggerDismiss();
    }, toast.duration);

    return () => {
      clearTimeout(enterTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [toast.duration, triggerDismiss]);

  return (
    <div
      className={`
        relative flex items-start gap-3 w-full max-w-sm rounded-2xl px-4 py-3.5 shadow-2xl
        border backdrop-blur-md overflow-hidden
        transition-all duration-350 ease-out
        ${config.bgClass} ${config.borderClass}
        bg-zinc-900/90
        ${visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
        ${leaving ? 'opacity-0 translate-x-8' : ''}
      `}
      style={{ transition: 'opacity 350ms ease, transform 350ms ease' }}
    >
      {/* Icon */}
      <Icon size={18} className={`shrink-0 mt-0.5 ${config.iconClass}`} />

      {/* Message */}
      <p className="text-sm text-zinc-100 font-medium leading-snug flex-1 pr-1">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={triggerDismiss}
        className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer -mt-0.5"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${config.progressClass} transition-none rounded-full opacity-60`}
        style={{ width: `${progress}%` }}
      />
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
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
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
