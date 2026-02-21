"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { checkIsAdmin } from "@/lib/isAdmin";

export interface UseAdminResult {
  isAdmin: boolean;
  loading: boolean;
  user: import("firebase/auth").User | null;
}

/**
 * React hook to check if the current user has admin privileges.
 * Loads auth state, forces token refresh, and checks custom claim admin: true.
 */
export function useAdmin(): UseAdminResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<import("firebase/auth").User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (!u) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      try {
        const admin = await checkIsAdmin();
        setIsAdmin(admin);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, loading, user };
}
