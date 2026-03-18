"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizes[size]}
          bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md
          animate-slide-up
        `}
      >
        {/* Header */}
        {(title || description) && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-[#EEE6E4]">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-gray-400 mt-1">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#EEE6E4] p-1 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Close button when no header */}
        {!title && !description && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-[#EEE6E4] p-1 rounded-lg hover:bg-white/5 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "default";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  confirmVariant = "default",
  loading = false,
}: ConfirmModalProps) {
  const confirmStyles = {
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    default: "bg-[#006079] hover:bg-[#007A99] text-white",
  };

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="p-6 pt-0 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-400 hover:text-[#EEE6E4] border border-white/10 hover:border-white/20 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${confirmStyles[confirmVariant]}`}
        >
          {loading ? "Aguarde..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
