import { getDb } from "@/lib/firebase-app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import type { WineBatch, CreateInput, UpdateInput } from "@/types/firestore";

const COLLECTION = "wineBatches";

export const wineBatchesService = {
  async getWineBatch(userId: string, batchId: string): Promise<WineBatch | null> {
    const db = await getDb();
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTION, batchId));
      if (!snap.exists()) return null;
      const data = { id: snap.id, ...snap.data() } as WineBatch;
      if (data.userId !== userId) return null;
      return data;
    } catch (e) {
      console.error("getWineBatch error:", e);
      return null;
    }
  },

  async getUserWineBatches(userId: string): Promise<WineBatch[]> {
    const db = await getDb();
    if (!db) return [];
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTION), where("userId", "==", userId))
      );
      const batches = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WineBatch[];
      return batches.sort((a, b) => {
        const aT = typeof a.startDate === "string" ? new Date(a.startDate).getTime() : 0;
        const bT = typeof b.startDate === "string" ? new Date(b.startDate).getTime() : 0;
        return bT - aT;
      });
    } catch (e) {
      console.error("getUserWineBatches error:", e);
      return [];
    }
  },

  async createWineBatch(userId: string, data: CreateInput<WineBatch>): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const now = new Date().toISOString();
    const docId = `${userId}_${Date.now()}`;
    await setDoc(doc(db, COLLECTION, docId), {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
    });
    return docId;
  },

  async updateWineBatch(userId: string, batchId: string, data: UpdateInput<WineBatch>): Promise<void> {
    const existing = await this.getWineBatch(userId, batchId);
    if (!existing) throw new Error("Wine batch not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await updateDoc(doc(db, COLLECTION, batchId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteWineBatch(userId: string, batchId: string): Promise<void> {
    const existing = await this.getWineBatch(userId, batchId);
    if (!existing) throw new Error("Wine batch not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await deleteDoc(doc(db, COLLECTION, batchId));
  },
};
