"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { GEORGIA_REGIONS } from "@/lib/georgiaRegions";

type GeorgiaRegion = (typeof GEORGIA_REGIONS)[number];

interface RegionSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

function getRegionLabel(
  key: string,
  t: (k: string) => string,
): string {
  if (GEORGIA_REGIONS.includes(key as GeorgiaRegion)) {
    const label = t(`market.regions.${key}`);
    return label.startsWith("market.") ? key : label;
  }
  return key;
}

export default function RegionSearchInput({
  value,
  onChange,
  t,
  placeholder,
  disabled = false,
  required = false,
  className = "",
  id,
}: RegionSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayValue = value
    ? getRegionLabel(value, t)
    : "";
  const showQuery = isOpen ? query : displayValue;

  const filteredRegions = GEORGIA_REGIONS.filter((key) => {
    const label = getRegionLabel(key, t).toLowerCase();
    const q = query.trim().toLowerCase();
    return !q || label.includes(q) || key.toLowerCase().includes(q);
  });

  // Include legacy value if it's not in the list
  const options = [
    ...(value &&
    !GEORGIA_REGIONS.includes(value as GeorgiaRegion) &&
    (!query.trim() ||
      getRegionLabel(value, t).toLowerCase().includes(query.trim().toLowerCase()))
      ? [value]
      : []),
    ...filteredRegions.filter((r) => r !== value),
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  const handleSelect = (key: string) => {
    onChange(key);
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setQuery("");
      }
      return;
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery(displayValue);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && options[highlightIndex]) {
      e.preventDefault();
      handleSelect(options[highlightIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          id={id}
          type="text"
          value={showQuery}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery(displayValue);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("market.selectRegion")}
          disabled={disabled}
          required={required && !value}
          autoComplete="off"
          className={`w-full pl-10 pr-10 py-3.5 rounded-xl border border-[#e8e6e1] bg-[#fafaf8] text-[#1f2a1f] text-base placeholder-[#8a9a85] focus:ring-2 focus:ring-[#04AA6D]/40 focus:border-[#04AA6D] outline-none transition-colors ${className}`}
        />
        <ChevronDown
          size={18}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white overflow-hidden"
          style={{
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          <div className="max-h-56 overflow-y-auto py-2">
            {options.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">
                {t("market.regionNoMatches")}
              </p>
            ) : (
              options.map((key, i) => {
                const label = getRegionLabel(key, t);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(key)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                      i === highlightIndex
                        ? "bg-[#04AA6D]/10 text-[#04AA6D]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base opacity-60">📍</span>
                    {label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
