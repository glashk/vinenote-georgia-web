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
import type { FinanceEntry, CreateFinanceEntryInput } from "@/types/finance";

const COLLECTION = "finance";

export const financeService = {
  async getFinanceEntry(userId: string, financeId: string): Promise<FinanceEntry | null> {
    const db = await getDb();
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTION, financeId));
      if (!snap.exists()) return null;
      const data = { id: snap.id, ...snap.data() } as FinanceEntry;
      if (data.userId !== userId) return null;
      return data;
    } catch (e) {
      console.error("getFinanceEntry error:", e);
      return null;
    }
  },

  async getUserFinanceEntries(userId: string): Promise<FinanceEntry[]> {
    const db = await getDb();
    if (!db) return [];
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTION), where("userId", "==", userId))
      );
      const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FinanceEntry[];
      return entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    } catch (e) {
      console.error("getUserFinanceEntries error:", e);
      return [];
    }
  },

  async createFinanceEntry(userId: string, input: CreateFinanceEntryInput): Promise<string> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error("Amount must be > 0");
    }
    if (!input.category) throw new Error("Category is required");
    if (!input.date) throw new Error("Date is required");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const docId = `${userId}_${Date.now()}`;
    await setDoc(doc(db, COLLECTION, docId), {
      ...input,
      userId,
      currency: "GEL",
      createdAt: new Date().toISOString(),
    });
    return docId;
  },

  async updateFinanceEntry(userId: string, financeId: string, input: CreateFinanceEntryInput): Promise<void> {
    const existing = await this.getFinanceEntry(userId, financeId);
    if (!existing) throw new Error("Finance entry not found");
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error("Amount must be > 0");
    }
    if (!input.category) throw new Error("Category is required");
    if (!input.date) throw new Error("Date is required");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await updateDoc(doc(db, COLLECTION, financeId), {
      type: input.type,
      amount: input.amount,
      currency: "GEL",
      category: input.category,
      date: input.date,
      notes: input.notes,
    });
  },

  async deleteFinanceEntry(userId: string, financeId: string): Promise<void> {
    const existing = await this.getFinanceEntry(userId, financeId);
    if (!existing) throw new Error("Finance entry not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await deleteDoc(doc(db, COLLECTION, financeId));
  },
};
