"use client";

import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import { collection, query, onSnapshot, Timestamp } from "firebase/firestore";
import type { UserProfile } from "../types";

export type UserFilter =
  | "all"
  | "new" // last 7 days
  | "reported"
  | "banned"
  | "high_activity";

export function useUsers(filter: UserFilter = "all") {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    getDb().then((db) => {
      if (!db) {
        setLoading(false);
        return;
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef);

      unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt ?? Timestamp.now(),
          } as UserProfile;
        });
        list.sort((a, b) => {
          const aSec = (a.createdAt as { seconds?: number })?.seconds ?? 0;
          const bSec = (b.createdAt as { seconds?: number })?.seconds ?? 0;
          return bSec - aSec;
        });
        setUsers(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        setError(err?.message ?? "Error loading users");
      }
    );
    });

    return () => unsubscribe?.();
  }, []);

  const filteredUsers = users.filter((u) => {
    const created = u.createdAt
      ? new Date(
          (u.createdAt as { seconds: number }).seconds * 1000
        ).getTime()
      : 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (filter === "new") return created > sevenDaysAgo;
    if (filter === "banned") return u.banned === true;
    // reported and high_activity need extra data - simplified for now
    return true;
  });

  return {
    users: filteredUsers,
    allUsers: users,
    loading,
    error,
  };
}
