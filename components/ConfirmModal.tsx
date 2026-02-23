"use client";

import { useEffect } from "react";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "neutral";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "neutral",
  loading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: "🗑️",
      confirmClass:
        "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500",
    },
    warning: {
      icon: "⚠️",
      confirmClass:
        "bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500",
    },
    neutral: {
      icon: "ℹ️",
      confirmClass:
        "bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-500",
    },
  };

  const styles = variantStyles[variant];

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={loading ? undefined : onClose}
      />
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl animate-scale-in border border-slate-200/50 dark:border-slate-600/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <span className="text-3xl flex-shrink-0">{styles.icon}</span>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${styles.confirmClass}`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
