/**
 * Firebase app, Firestore, Storage, Analytics - NO auth.
 * Use this for public pages to avoid loading firebase/auth in the critical path.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8Ih_m5ZfvAl3mYaixu0-eWUh9e_t1ddw",
  authDomain: "vinenote-georgia.firebaseapp.com",
  projectId: "vinenote-georgia",
  storageBucket: "vinenote-georgia.firebasestorage.app",
  messagingSenderId: "360665380354",
  appId: "1:360665380354:web:e2198ef58d00e327cc991b",
  measurementId: "G-7BGKPELHWJ",
};

let app: FirebaseApp;
if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} else {
  app = null as unknown as FirebaseApp;
}

let _db: Firestore | null = null;
export async function getDb(): Promise<Firestore | null> {
  if (typeof window === "undefined") return null;
  if (_db) return _db;
  const firebaseApp =
    app ?? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));
  const { getFirestore } = await import("firebase/firestore");
  _db = getFirestore(firebaseApp);
  return _db;
}

let _storage: import("firebase/storage").FirebaseStorage | null = null;
export async function getFirebaseStorage(): Promise<import("firebase/storage").FirebaseStorage | null> {
  if (typeof window === "undefined") return null;
  if (!app) return null;
  if (_storage) return _storage;
  const { getStorage } = await import("firebase/storage");
  _storage = getStorage(app);
  return _storage;
}

let _analytics: Analytics | null = null;
export async function getAnalyticsLazy(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (_analytics) return _analytics;
  const supported = await isSupported();
  if (supported) {
    _analytics = getAnalytics(app);
  }
  return _analytics;
}

export { app };
