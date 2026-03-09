/**
 * Firebase - re-exports from firebase-app (no top-level firebase imports).
 * For auth: use getAuthLazy() or useAuth() from AuthContext.
 * Do NOT import auth here - it would block LCP.
 */
export {
  getDb,
  getFirebaseStorage,
  getAnalyticsLazy,
} from "./firebase-app";
export { getAuthLazy } from "./firebase-auth";
