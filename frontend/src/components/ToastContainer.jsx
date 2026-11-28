import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';

const VARIANT_CLASSES = {
  success: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-100',
  error: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/90 text-red-950 dark:text-red-100',
  warning: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/90 text-amber-950 dark:text-amber-100',
  info: 'border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-white',
};

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styleClass = VARIANT_CLASSES[toast.variant] || VARIANT_CLASSES.info;

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all ${styleClass}`}
    >
      <p className="leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Tutup notifikasi"
        className="shrink-0 rounded-lg px-1.5 py-0.5 text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer"
      >
        Tutup
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[min(24rem,calc(100vw-2rem))] pointer-events-none safe-bottom"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
