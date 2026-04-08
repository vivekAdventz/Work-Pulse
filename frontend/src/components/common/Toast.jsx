import { useState, useCallback, useEffect } from 'react';

const ICONS = {
  success: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
};

const STYLES = {
  success: 'bg-green-500 border-green-600 text-white',
  error:   'bg-red-50 border-red-300 text-red-800',
  info:    'bg-sky-50 border-sky-300 text-sky-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
};

const ICON_STYLES = {
  success: 'text-white',
  error:   'text-red-500',
  info:    'text-sky-500',
  warning: 'text-amber-500',
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm pointer-events-auto transition-all duration-300 ${STYLES[toast.type]} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
    >
      <span className={ICON_STYLES[toast.type]}>{ICONS[toast.type]}</span>
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={handleClose}
        className="text-current opacity-50 hover:opacity-100 transition-opacity shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
