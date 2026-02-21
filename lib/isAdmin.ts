import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { getIdTokenResult } from "firebase/auth";

/**
 * Checks if the currently logged-in user has admin custom claim.
 * Uses Firebase Auth custom claims (admin: true).
 * Admins are set manually via Firebase Admin SDK outside the app.
 *
 * @returns Promise<boolean> - true only if user has admin: true claim
 */
export async function checkIsAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!auth) return false;

  const user = auth.currentUser;
  if (!user) return false;

  try {
    // Force refresh to get latest custom claims
    const tokenResult = await user.getIdTokenResult(true);
    return tokenResult.claims?.admin === true;
  } catch {
    return false;
  }
}

/**
 * Resolves when auth state is ready, then checks admin claim.
 * Use this when you need to wait for auth initialization.
 */
export function getAdminStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (!auth) {
      resolve(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      unsubscribe();
      if (!user) {
        resolve(false);
        return;
      }
      try {
        const tokenResult = await user.getIdTokenResult(true);
        resolve(tokenResult.claims?.admin === true);
      } catch {
        resolve(false);
      }
    });
  });
}
