"use client";

import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

export interface DashboardStats {
  activeUsersToday: number;
  newUsers24h: number;
  listingsToday: number;
  openReportsCount: number;
  messagesToday: number;
}

export interface DailyPoint {
  date: string;
  count: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    activeUsersToday: 0,
    newUsers24h: 0,
    listingsToday: 0,
    openReportsCount: 0,
    messagesToday: 0,
  });
  const [dailyUsers, setDailyUsers] = useState<DailyPoint[]>([]);
  const [dailyListings, setDailyListings] = useState<DailyPoint[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    let cancelled = false;

    getDb().then((db) => {
      if (cancelled || !db) {
        setLoading(false);
        return;
      }

      // Open reports count (real-time)
      unsubs.push(
        onSnapshot(collection(db, "reports"), (snap) => {
          const open = snap.docs.filter((d) => {
            const s = d.data().status;
            return s !== "dismissed" && s !== "resolved";
          }).length;
          setStats((s) => ({ ...s, openReportsCount: open }));
        })
      );

    // Listings today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const listingsRef = collection(db, "marketListings");
    unsubs.push(
      onSnapshot(listingsRef, (snap) => {
        let today = 0;
        const byDay: Record<string, number> = {};
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        snap.docs.forEach((d) => {
          const data = d.data();
          const ts = data.createdAt as { seconds?: number } | undefined;
          if (!ts?.seconds) return;
          const date = new Date(ts.seconds * 1000);
          if (date >= todayStart) today++;
          if (date.getTime() > thirtyDaysAgo) {
            const key = date.toISOString().slice(0, 10);
            byDay[key] = (byDay[key] ?? 0) + 1;
          }
        });

        setStats((s) => ({ ...s, listingsToday: today }));
        setDailyListings(
          Object.entries(byDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }))
        );
      })
    );

    // Users - new in 24h, daily for 30 days
    const usersRef = collection(db, "users");
    unsubs.push(
      onSnapshot(usersRef, (snap) => {
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        let new24h = 0;
        const byDay: Record<string, number> = {};

        snap.docs.forEach((d) => {
          const data = d.data();
          const ts = data.createdAt as { seconds?: number } | undefined;
          if (!ts?.seconds) return;
          const date = new Date(ts.seconds * 1000);
          if (date.getTime() > dayAgo) new24h++;
          if (date.getTime() > thirtyDaysAgo) {
            const key = date.toISOString().slice(0, 10);
            byDay[key] = (byDay[key] ?? 0) + 1;
          }
        });

        setStats((s) => ({
          ...s,
          newUsers24h: new24h,
          activeUsersToday: new24h, // Approximate - we don't have lastLogin
        }));
        setDailyUsers(
          Object.entries(byDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }))
        );
      })
    );

    // Reports per day (one-time fetch for last 30 days)
    const fetchReportsByDay = async () => {
      const snap = await getDocs(collection(db, "reports"));
      const byDay: Record<string, number> = {};
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      snap.docs.forEach((d) => {
        const data = d.data();
        const ts = data.createdAt as { seconds?: number } | undefined;
        if (!ts?.seconds) return;
        const date = new Date(ts.seconds * 1000);
        if (date.getTime() > thirtyDaysAgo) {
          const key = date.toISOString().slice(0, 10);
          byDay[key] = (byDay[key] ?? 0) + 1;
        }
      });
      setDailyReports(
        Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count }))
      );
    };
    fetchReportsByDay();

      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, []);

  return {
    stats,
    dailyUsers,
    dailyListings,
    dailyReports,
    loading,
  };
}
