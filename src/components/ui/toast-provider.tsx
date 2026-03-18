"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { X, CheckCircle, XCircle, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (m: string) => addToast(m, "success"),
    error: (m: string) => addToast(m, "error"),
    info: (m: string) => addToast(m, "info"),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notificações"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Single Toast ─────────────────────────────────────────────────────────────

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-[#009CD9] flex-shrink-0" />,
  };

  const borders: Record<ToastVariant, string> = {
    success: "border-green-500/30",
    error: "border-red-500/30",
    info: "border-[#009CD9]/30",
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 bg-white/5 backdrop-blur-md border ${borders[toast.variant]} rounded-xl px-4 py-3 shadow-xl max-w-xs w-full animate-slide-up`}
    >
      {icons[toast.variant]}
      <span className="text-[#EEE6E4] text-sm flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-[#EEE6E4] transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
