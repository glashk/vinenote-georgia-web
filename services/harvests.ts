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
import type { Harvest, CreateInput, UpdateInput } from "@/types/firestore";

const COLLECTION = "harvests";

export const harvestsService = {
  async getHarvest(userId: string, harvestId: string): Promise<Harvest | null> {
    const db = await getDb();
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTION, harvestId));
      if (!snap.exists()) return null;
      const data = { id: snap.id, ...snap.data() } as Harvest;
      if (data.userId !== userId) return null;
      return data;
    } catch (e) {
      console.error("getHarvest error:", e);
      return null;
    }
  },

  async getUserHarvests(userId: string): Promise<Harvest[]> {
    const db = await getDb();
    if (!db) return [];
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTION), where("userId", "==", userId))
      );
      const harvests = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Harvest[];
      return harvests.sort((a, b) => {
        const aT = typeof a.date === "string" ? new Date(a.date).getTime() : 0;
        const bT = typeof b.date === "string" ? new Date(b.date).getTime() : 0;
        return bT - aT;
      });
    } catch (e) {
      console.error("getUserHarvests error:", e);
      return [];
    }
  },

  async createHarvest(userId: string, data: CreateInput<Harvest>): Promise<string> {
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

  async updateHarvest(userId: string, harvestId: string, data: UpdateInput<Harvest>): Promise<void> {
    const existing = await this.getHarvest(userId, harvestId);
    if (!existing) throw new Error("Harvest not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await updateDoc(doc(db, COLLECTION, harvestId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteHarvest(userId: string, harvestId: string): Promise<void> {
    const existing = await this.getHarvest(userId, harvestId);
    if (!existing) throw new Error("Harvest not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await deleteDoc(doc(db, COLLECTION, harvestId));
  },
};
