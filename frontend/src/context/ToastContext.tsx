import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 3500 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev.slice(-3), { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', title, message, duration: 4500 });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', title, message, duration: 4000 });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ addToast: showToast, showToast, success, error, info, warning, dismiss }}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[100] flex flex-col space-y-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto rounded-2xl p-4 shadow-soft-lg border flex items-start space-x-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2',
              t.type === 'success' && 'bg-white border-emerald-100 text-emerald-950',
              t.type === 'error' && 'bg-white border-rose-100 text-rose-950',
              t.type === 'info' && 'bg-white border-blue-100 text-blue-950',
              t.type === 'warning' && 'bg-white border-amber-100 text-amber-950'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-lifeos-blue" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            </div>

            <div className="flex-1 min-w-0">
              {t.title && <h5 className="text-xs font-bold uppercase tracking-wider mb-0.5 text-lifeos-navy">{t.title}</h5>}
              <p className="text-sm font-medium leading-snug text-lifeos-dark">{t.message}</p>
            </div>

            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 p-1 text-lifeos-subtle hover:text-lifeos-navy rounded-lg transition"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
