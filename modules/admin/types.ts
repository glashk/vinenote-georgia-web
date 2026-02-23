import type { Timestamp } from "firebase/firestore";

// ─── Listing ─────────────────────────────────────────────────────────────
export type MarketCategory = "grapes" | "wine" | "nobati";
export type ListingStatus = "active" | "reserved" | "sold" | "expired" | "removed";

export interface Listing {
  id: string;
  variety?: string;
  title?: string;
  description?: string;
  notes?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  region?: string;
  village?: string;
  category?: MarketCategory;
  harvestDate?: string;
  sugarBrix?: number;
  vintageYear?: number;
  phone?: string;
  contactName?: string;
  photoUrls?: string[];
  photoUrls200?: string[];
  photoUrls400?: string[];
  imageUrl?: string;
  image?: string;
  image200?: string;
  image400?: string;
  photos?: string[];
  thumbnail?: string;
  hidden?: boolean;
  hiddenAt?: Timestamp | null;
  hiddenReason?: string | null;
  status?: ListingStatus;
  userId?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number };
  flaggedBySystem?: boolean;
  flagReasons?: string[];
}

// ─── Report ─────────────────────────────────────────────────────────────
export interface Report {
  id: string;
  listingId: string;
  reportedUserId: string;
  reporterId: string;
  reason: string;
  createdAt: Timestamp | { seconds: number; nanoseconds?: number };
  status?: "pending" | "dismissed" | "resolved";
  reviewedAt?: Timestamp | null;
  listing?: Listing | null;
}

// ─── User (profile from Firestore) ───────────────────────────────────────
export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  nickname?: string;
  photoURL?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number };
  lastLoginAt?: Timestamp | null;
  banned?: boolean;
  suspendedUntil?: Timestamp | null;
  platform?: "ios" | "android" | "web";
}

// ─── Admin Log ───────────────────────────────────────────────────────────
export type AdminAction =
  | "warn_user"
  | "delete_listing"
  | "ban_user"
  | "mark_safe"
  | "hide_listing"
  | "unhide_listing"
  | "suspend_user"
  | "reset_nickname"
  | "delete_all_listings"
  | "send_system_message"
  | "shadow_mute"
  | "feature_listing"
  | "approve_listing";

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: AdminAction;
  targetUserId?: string;
  listingId?: string;
  reportId?: string;
  timestamp: Timestamp | { seconds: number; nanoseconds?: number };
  note?: string;
}

// ─── Admin Notification ─────────────────────────────────────────────────
export type NotificationType =
  | "new_report"
  | "new_user_spike"
  | "user_banned"
  | "system_warning"
  | "listing_flagged";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp | { seconds: number; nanoseconds?: number };
  metadata?: Record<string, unknown>;
}
