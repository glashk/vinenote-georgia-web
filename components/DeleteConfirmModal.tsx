"use client";

import { useEffect, useState } from "react";

const CONFIRM_TEXT = "DELETE";

export interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  typeConfirmLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete permanently",
  cancelLabel = "Cancel",
  typeConfirmLabel = "Type DELETE to confirm",
  loadingLabel = "Deleting...",
  loading = false,
}: DeleteConfirmModalProps) {
  const [typed, setTyped] = useState("");
  const canConfirm = typed === CONFIRM_TEXT && !loading;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setTyped("");
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={loading ? undefined : onClose}
      />
      <div
        className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-scale-in border border-slate-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <span className="text-3xl flex-shrink-0">🗑️</span>
          <div className="flex-1 min-w-0">
            <h2
              id="delete-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="delete-type-confirm" className="block text-sm font-medium text-slate-700">
            {typeConfirmLabel}
          </label>
          <input
            id="delete-type-confirm"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value.toUpperCase())}
            placeholder={CONFIRM_TEXT}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-mono uppercase placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="inline-flex items-center gap-3">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {loadingLabel}
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
