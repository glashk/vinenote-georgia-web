"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  /** True once auth has been checked (may still be null = logged out) */
  ready: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Client-only AuthProvider. Initializes Firebase Auth in useEffect (after first paint).
 * Children render immediately; auth state hydrates asynchronously.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(async () => {
    const { getAuthLazy } = await import("@/lib/firebase-auth");
    const { signOut: firebaseSignOut } = await import("firebase/auth");
    const auth = await getAuthLazy();
    await firebaseSignOut(auth);
  }, []);

  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Defer auth init until after first paint to avoid blocking LCP
    const init = () => {
      import("@/lib/firebase-auth")
        .then(({ getAuthLazy }) => getAuthLazy())
        .then(async (auth) => {
          const { onAuthStateChanged } = await import("firebase/auth");
          unsubRef.current = onAuthStateChanged(auth, (u: User | null) => {
            setUser(u);
            setReady(true);
          });
        })
        .catch(() => setReady(true));
    };

    const useIdle =
      typeof requestIdleCallback !== "undefined" &&
      typeof cancelIdleCallback !== "undefined";
    const id = useIdle
      ? requestIdleCallback(init, { timeout: 2000 })
      : setTimeout(init, 1500);

    return () => {
      useIdle ? cancelIdleCallback(id as number) : clearTimeout(id);
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
