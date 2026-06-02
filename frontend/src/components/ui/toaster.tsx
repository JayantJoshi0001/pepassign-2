'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
};

type ToastInput = Omit<Toast, 'id'>;

type ToastContextValue = {
  toast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const nextToast: Toast = { id: buildId(), ...input };
    setToasts((current) => [...current, nextToast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== nextToast.id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${
              item.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                : item.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-950'
                  : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <div className="text-sm font-semibold">{item.title}</div>
            {item.description ? <div className="mt-1 text-sm opacity-90">{item.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
