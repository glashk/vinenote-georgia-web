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
import type { VineyardBlock, CreateVineyardBlockInput, UpdateVineyardBlockInput } from "@/types/vineyard";

const COLLECTION = "vineyardBlocks";

export const vineyardBlocksService = {
  async getVineyardBlock(
    userId: string,
    blockId: string
  ): Promise<VineyardBlock | null> {
    const db = await getDb();
    if (!db) return null;
    try {
      const docRef = doc(db, COLLECTION, blockId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const data = { id: snap.id, ...snap.data() } as VineyardBlock;
      if (data.userId !== userId) return null;
      return data;
    } catch (e) {
      console.error("getVineyardBlock error:", e);
      return null;
    }
  },

  async getUserVineyardBlocks(userId: string): Promise<VineyardBlock[]> {
    const db = await getDb();
    if (!db) return [];
    try {
      const q = query(
        collection(db, COLLECTION),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      const blocks = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as VineyardBlock[];
      return blocks.sort((a, b) => {
        const aT = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
        const bT = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
        return bT - aT;
      });
    } catch (e) {
      console.error("getUserVineyardBlocks error:", e);
      return [];
    }
  },

  async createVineyardBlock(
    userId: string,
    data: CreateVineyardBlockInput
  ): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const now = new Date().toISOString();
    const docId = `${userId}_${Date.now()}`;
    const block: Omit<VineyardBlock, "id"> & { id: string } = {
      ...data,
      id: docId,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, COLLECTION, docId), block);
    return docId;
  },

  async updateVineyardBlock(
    userId: string,
    blockId: string,
    data: UpdateVineyardBlockInput
  ): Promise<void> {
    const existing = await this.getVineyardBlock(userId, blockId);
    if (!existing) throw new Error("Vineyard block not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const update: Partial<VineyardBlock> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, COLLECTION, blockId), update);
  },

  async deleteVineyardBlock(userId: string, blockId: string): Promise<void> {
    const existing = await this.getVineyardBlock(userId, blockId);
    if (!existing) throw new Error("Vineyard block not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await deleteDoc(doc(db, COLLECTION, blockId));
  },
};
