/**
 * Lazy Firebase Auth - loads ONLY when getAuthLazy() is called.
 * Uses getFirebase() from firebase/client - no top-level firebase imports.
 * Use via AuthProvider (useAuth) or getAuthLazy for auth-required pages.
 */
import type { Auth } from "firebase/auth";
import { getFirebase } from "./firebase/client";

let _auth: Auth | null = null;
let _authPromise: Promise<Auth> | null = null;

export async function getAuthLazy(): Promise<Auth> {
  if (_auth) return _auth;
  if (_authPromise) return _authPromise;

  _authPromise = getFirebase().then(({ auth }) => {
    _auth = auth;
    return auth;
  });

  return _authPromise;
}
