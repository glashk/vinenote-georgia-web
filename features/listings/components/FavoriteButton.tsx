"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteButtonProps {
  listingId: string;
  isFavorite: boolean;
  onToggle: (listingId: string, e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Favorite button - loads firebase only when toggling (on demand).
 * Use with dynamic import for public pages:
 *   const FavoriteButton = dynamic(() => import("./FavoriteButton"), { ssr: false });
 * Render a static placeholder (e.g. outline heart) for SSR.
 */
export function FavoriteButton({
  listingId,
  isFavorite,
  onToggle,
  disabled = false,
  className = "",
  size = "md",
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
        router.push("/login?redirect=/");
        return;
      }
      onToggle(listingId, e);
    },
    [user, listingId, onToggle, router]
  );

  const iconSize = size === "sm" ? 16 : 20;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`rounded-full p-1.5 transition-colors hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400/50 disabled:opacity-60 ${className}`}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={iconSize}
        strokeWidth={2}
        fill={isFavorite ? "currentColor" : "none"}
        className={isFavorite ? "text-rose-500" : "text-slate-400"}
      />
    </button>
  );
}
