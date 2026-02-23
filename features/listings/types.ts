import type { Timestamp } from "firebase/firestore";

export const LISTING_EXPIRY_DAYS = 30;

export type ListingStatus = "active" | "reserved" | "sold" | "expired" | "removed";

export interface Listing {
  id: string;
  variety?: string;
  title?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  region?: string;
  village?: string;
  category?: string;
  photoUrls?: string[];
  photoUrls200?: string[];
  imageUrl?: string;
  image?: string;
  image200?: string;
  photos?: string[];
  thumbnail?: string;
  mainImage?: string;
  photo?: string;
  status?: ListingStatus;
  userId?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number } | Date;
}

export interface ListingsFilters {
  status: ListingStatus | "all";
  category: string;
  search: string;
}
