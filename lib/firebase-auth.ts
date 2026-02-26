/**
 * Lazy Firebase Auth - loads ONLY when getAuthLazy() is called.
 * Never import this from the root layout or public page components.
 * Use via AuthProvider (useAuth) or getAuthLazy for auth-required pages.
 */
import type { Auth } from "firebase/auth";

let _auth: Auth | null = null;
let _authPromise: Promise<Auth> | null = null;

export async function getAuthLazy(): Promise<Auth> {
  if (_auth) return _auth;
  if (_authPromise) return _authPromise;

  _authPromise = (async () => {
    const { getAuth } = await import("firebase/auth");
    const { getApp } = await import("firebase/app");
    const app = getApp();
    _auth = getAuth(app);
    return _auth;
  })();

  return _authPromise;
}
