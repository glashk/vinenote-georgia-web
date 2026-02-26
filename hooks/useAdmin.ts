"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, ready } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    checkIsAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, [user, ready]);

  return { isAdmin, loading, user };
}
