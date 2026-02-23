"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Listing, ListingStatus } from "../types";

interface ListingActionsMenuProps {
  listing: Listing;
  onEdit: () => void;
  onMarkSold: () => void;
  onMarkReserved: () => void;
  onRemove: () => void;
  onDelete: () => void;
}

export function ListingActionsMenu({
  listing,
  onEdit,
  onMarkSold,
  onMarkReserved,
  onRemove,
  onDelete,
}: ListingActionsMenuProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const status = (listing.status ?? "active") as ListingStatus;

  useLayoutEffect(() => {
    if (open && buttonRef.current && typeof document !== "undefined") {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 200;
      const menuHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < menuHeight && rect.top > spaceBelow;

      const left = Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      );

      setMenuStyle({
        position: "fixed",
        left,
        top: openAbove ? undefined : rect.bottom + 8,
        bottom: openAbove ? window.innerHeight - rect.top + 8 : undefined,
        width: menuWidth,
        zIndex: 9999,
      });
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        open &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleAction = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200"
        aria-label={t("nav.menu")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="18" r="1.5" />
        </svg>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="min-w-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl"
            role="menu"
          >
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleAction(onEdit)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                role="menuitem"
              >
                <svg
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {t("common.edit")}
              </button>
              {status !== "sold" && (
                <button
                  type="button"
                  onClick={() => handleAction(onMarkSold)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  <span className="text-lg">✓</span>
                  {t("market.markAsSold")}
                </button>
              )}
              {status !== "reserved" && (
                <button
                  type="button"
                  onClick={() => handleAction(onMarkReserved)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  <span className="text-lg">📌</span>
                  {t("market.markAsReserved")}
                </button>
              )}
              {status !== "removed" && (
                <button
                  type="button"
                  onClick={() => handleAction(onRemove)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-amber-700 hover:bg-amber-50"
                  role="menuitem"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  {t("market.removeListing")}
                </button>
              )}
            </div>
            <div className="border-t border-slate-200 py-1">
              <button
                type="button"
                onClick={() => handleAction(onDelete)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {t("market.deleteListing")}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
