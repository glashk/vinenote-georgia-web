/**
 * Firebase app, Firestore, Storage, Analytics - NO top-level firebase imports.
 * All firebase code is loaded via dynamic import only when these functions are called.
 * Use this for public pages - firebase loads only when getDb/getAnalyticsLazy is invoked.
 */
import { getFirebase } from "./firebase/client";

let _db: import("firebase/firestore").Firestore | null = null;
let _storage: import("firebase/storage").FirebaseStorage | null = null;
let _analytics: import("firebase/analytics").Analytics | null = null;

export async function getDb(): Promise<import("firebase/firestore").Firestore | null> {
  if (typeof window === "undefined") return null;
  if (_db) return _db;
  const { app } = await getFirebase();
  const { getFirestore } = await import("firebase/firestore");
  _db = getFirestore(app);
  return _db;
}

export async function getFirebaseStorage(): Promise<import("firebase/storage").FirebaseStorage | null> {
  if (typeof window === "undefined") return null;
  if (_storage) return _storage;
  const { app } = await getFirebase();
  const { getStorage } = await import("firebase/storage");
  _storage = getStorage(app);
  return _storage;
}

export async function getAnalyticsLazy(): Promise<import("firebase/analytics").Analytics | null> {
  if (typeof window === "undefined") return null;
  if (_analytics) return _analytics;
  const { app } = await getFirebase();
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  const supported = await isSupported();
  if (supported) {
    _analytics = getAnalytics(app);
  }
  return _analytics;
}
