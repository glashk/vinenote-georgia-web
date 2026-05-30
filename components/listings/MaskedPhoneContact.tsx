"use client";

import { useState, useCallback } from "react";
import { Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  maskPhoneNumber,
  incrementPhoneClick,
} from "@/features/listings/analytics";

interface MaskedPhoneContactProps {
  listingId: string;
  listingOwnerId?: string | null;
  phone: string;
  currentUserId?: string | null;
  variant?: "detail" | "compact";
  className?: string;
  onPhoneRevealed?: () => void;
}

export default function MaskedPhoneContact({
  listingId,
  listingOwnerId,
  phone,
  currentUserId,
  variant = "detail",
  className = "",
  onPhoneRevealed,
}: MaskedPhoneContactProps) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);

  const handleReveal = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (revealed || pending) return;
      setPending(true);
      setRevealed(true);
      onPhoneRevealed?.();
      try {
        await incrementPhoneClick(listingId, listingOwnerId ?? null, currentUserId);
      } finally {
        setPending(false);
      }
    },
    [
      revealed,
      pending,
      listingId,
      listingOwnerId,
      currentUserId,
      onPhoneRevealed,
    ]
  );

  const handleCall = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (variant === "compact") {
    return (
      <div
        className={`flex flex-col gap-2 w-full ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-xs text-slate-700 text-center">
          {revealed ? phone : maskPhoneNumber(phone)}
        </p>
        {!revealed ? (
          <button
            type="button"
            onClick={handleReveal}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg font-semibold text-white bg-[#04AA6D] hover:bg-[#039a5e] text-xs transition-colors disabled:opacity-70"
          >
            <Phone size={14} />
            {t("market.showPhone")}
          </button>
        ) : (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            onClick={handleCall}
            className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg font-semibold text-white bg-[#04AA6D] hover:bg-[#039a5e] text-xs transition-colors"
          >
            <Phone size={14} />
            {t("market.callPhone")}
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
          {t("market.phone")}
        </p>
        <p className="font-mono text-lg text-slate-900 break-all">
          {revealed ? phone : maskPhoneNumber(phone)}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        {!revealed ? (
          <button
            type="button"
            onClick={handleReveal}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#04AA6D] hover:bg-[#039a5e] transition-colors disabled:opacity-70"
          >
            <Phone size={18} />
            {t("market.showPhone")}
          </button>
        ) : (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            onClick={handleCall}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#04AA6D] hover:bg-[#039a5e] transition-colors"
          >
            <Phone size={18} />
            {t("market.callPhone")}
          </a>
        )}
      </div>
    </div>
  );
}
