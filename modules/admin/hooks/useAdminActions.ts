"use client";

import { useCallback } from "react";
import { getDb, auth } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import type { AdminAction } from "../types";

export function useAdminActions() {
  const logAction = useCallback(
    async (
      action: AdminAction,
      opts: {
        targetUserId?: string;
        listingId?: string;
        reportId?: string;
        note?: string;
      }
    ) => {
      const db = await getDb();
      if (!db || !auth?.currentUser) return;
      await addDoc(collection(db, "adminLogs"), {
        adminId: auth.currentUser.uid,
        adminEmail: auth.currentUser.email ?? undefined,
        action,
        targetUserId: opts.targetUserId ?? null,
        listingId: opts.listingId ?? null,
        reportId: opts.reportId ?? null,
        note: opts.note ?? null,
        timestamp: serverTimestamp(),
      });
    },
    []
  );

  const warnUser = useCallback(
    async (targetUserId: string, note?: string) => {
      const db = await getDb();
      if (!db) return;
      // Store warning in user doc or adminLogs only
      await logAction("warn_user", { targetUserId, note });
    },
    [logAction]
  );

  const deleteListing = useCallback(
    async (listingId: string, note?: string) => {
      const db = await getDb();
      if (!db) return;
      const listingRef = doc(db, "marketListings", listingId);
      const snap = await getDocs(
        query(
          collection(db, "reports"),
          where("listingId", "==", listingId)
        )
      );
      const reportId = snap.docs[0]?.id;
      await deleteDoc(listingRef);
      await logAction("delete_listing", {
        listingId,
        reportId,
        targetUserId: undefined,
        note,
      });
    },
    [logAction]
  );

  const banUser = useCallback(
    async (targetUserId: string, note?: string) => {
      const db = await getDb();
      if (!db) return;
      const userRef = doc(db, "users", targetUserId);
      await setDoc(
        userRef,
        {
          banned: true,
          bannedAt: serverTimestamp(),
          bannedReason: note ?? "Banned by admin",
        },
        { merge: true }
      );
      await logAction("ban_user", { targetUserId, note });
    },
    [logAction]
  );

  const markReportSafe = useCallback(
    async (reportId: string, note?: string) => {
      const db = await getDb();
      if (!db) return;
      const reportRef = doc(db, "reports", reportId);
      const snap = await getDoc(reportRef);
      const { listingId, reportedUserId } = snap.data() ?? {};
      await updateDoc(reportRef, {
        status: "resolved",
        reviewedAt: serverTimestamp(),
      });
      await logAction("mark_safe", {
        reportId,
        listingId,
        targetUserId: reportedUserId,
        note,
      });
    },
    [logAction]
  );

  const hideListing = useCallback(
    async (listingId: string, reason?: string) => {
      const db = await getDb();
      if (!db) return;
      await updateDoc(doc(db, "marketListings", listingId), {
        hidden: true,
        hiddenAt: serverTimestamp(),
        hiddenReason: reason ?? "admin",
      });
      await logAction("hide_listing", { listingId, note: reason });
    },
    [logAction]
  );

  const unhideListing = useCallback(
    async (listingId: string) => {
      const db = await getDb();
      if (!db) return;
      await updateDoc(doc(db, "marketListings", listingId), {
        hidden: false,
        hiddenAt: null,
        hiddenReason: null,
      });
      await logAction("unhide_listing", { listingId });
    },
    [logAction]
  );

  const dismissReport = useCallback(
    async (reportId: string) => {
      const db = await getDb();
      if (!db) return;
      await updateDoc(doc(db, "reports", reportId), {
        status: "dismissed",
        reviewedAt: serverTimestamp(),
      });
    },
    []
  );

  const featureListing = useCallback(
    async (listingId: string) => {
      const db = await getDb();
      if (!db) return;
      await updateDoc(doc(db, "marketListings", listingId), {
        featured: true,
        featuredAt: serverTimestamp(),
      });
      await logAction("feature_listing", { listingId });
    },
    [logAction]
  );

  const deleteAllUserListings = useCallback(
    async (userId: string, note?: string) => {
      const db = await getDb();
      if (!db) return;
      const q = query(
        collection(db, "marketListings"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      await logAction("delete_all_listings", { targetUserId: userId, note });
    },
    [logAction]
  );

  const resetUserNickname = useCallback(
    async (userId: string, newNickname: string) => {
      const db = await getDb();
      if (!db) return;
      await updateDoc(doc(db, "users", userId), {
        nickname: newNickname,
        nicknameResetAt: serverTimestamp(),
      });
      await logAction("reset_nickname", {
        targetUserId: userId,
        note: `Reset to: ${newNickname}`,
      });
    },
    [logAction]
  );

  const suspendUser = useCallback(
    async (userId: string, until: Date, note?: string) => {
      const db = await getDb();
      if (!db) return;
      await updateDoc(doc(db, "users", userId), {
        suspended: true,
        suspendedUntil: Timestamp.fromDate(until),
        suspendedReason: note,
      });
      await logAction("suspend_user", { targetUserId: userId, note });
    },
    [logAction]
  );

  return {
    logAction,
    warnUser,
    deleteListing,
    banUser,
    markReportSafe,
    hideListing,
    unhideListing,
    dismissReport,
    featureListing,
    deleteAllUserListings,
    resetUserNickname,
    suspendUser,
  };
}
