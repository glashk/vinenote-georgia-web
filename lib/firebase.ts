/**
 * Firebase - re-exports from firebase-app (no auth in critical path).
 * For auth: use getAuthLazy() or useAuth() from AuthContext.
 * Do NOT import auth here - it would block LCP.
 */
export {
  app,
  getDb,
  getFirebaseStorage,
  getAnalyticsLazy,
} from "./firebase-app";
export { getAuthLazy } from "./firebase-auth";
