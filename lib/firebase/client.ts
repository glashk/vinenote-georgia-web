/**
 * Lazy Firebase loader - NO top-level firebase imports.
 * Use this for auth-required features (favorites, add listing, profile, edit).
 * Public pages must NOT import this or any firebase module at top level.
 */

const firebaseConfig = {
  apiKey: "AIzaSyA8Ih_m5ZfvAl3mYaixu0-eWUh9e_t1ddw",
  authDomain: "vinenote-georgia.firebaseapp.com",
  projectId: "vinenote-georgia",
  storageBucket: "vinenote-georgia.firebasestorage.app",
  messagingSenderId: "360665380354",
  appId: "1:360665380354:web:e2198ef58d00e327cc991b",
  measurementId: "G-7BGKPELHWJ",
};

let _app: import("firebase/app").FirebaseApp | null = null;
let _auth: import("firebase/auth").Auth | null = null;
let _promise: Promise<{ app: import("firebase/app").FirebaseApp; auth: import("firebase/auth").Auth }> | null = null;

export async function getFirebase(): Promise<{
  app: import("firebase/app").FirebaseApp;
  auth: import("firebase/auth").Auth;
}> {
  if (_app && _auth) return { app: _app, auth: _auth };
  if (_promise) return _promise;

  _promise = (async () => {
    const [firebaseApp, firebaseAuth] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]);
    _app =
      firebaseApp.getApps().length === 0
        ? firebaseApp.initializeApp(firebaseConfig)
        : firebaseApp.getApp();
    _auth = firebaseAuth.getAuth(_app);
    return { app: _app, auth: _auth };
  })();

  return _promise;
}
