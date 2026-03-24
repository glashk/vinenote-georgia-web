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
import type { Inventory, CreateInput, UpdateInput } from "@/types/firestore";

const COLLECTION = "inventory";

export const inventoryService = {
  async getInventoryItem(userId: string, itemId: string): Promise<Inventory | null> {
    const db = await getDb();
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTION, itemId));
      if (!snap.exists()) return null;
      const data = { id: snap.id, ...snap.data() } as Inventory;
      if (data.userId !== userId) return null;
      return data;
    } catch (e) {
      console.error("getInventoryItem error:", e);
      return null;
    }
  },

  async getUserInventory(userId: string): Promise<Inventory[]> {
    const db = await getDb();
    if (!db) return [];
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTION), where("userId", "==", userId))
      );
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Inventory[];
      const getTime = (v: unknown): number => {
        if (!v) return 0;
        if (typeof v === "string") {
          const t = Date.parse(v);
          return Number.isFinite(t) ? t : 0;
        }
        if (typeof v === "object" && v !== null && "seconds" in v) {
          return (v as { seconds: number }).seconds * 1000;
        }
        return 0;
      };
      return items.sort((a, b) => getTime(b.updatedAt) - getTime(a.updatedAt));
    } catch (e) {
      console.error("getUserInventory error:", e);
      return [];
    }
  },

  async createInventoryItem(userId: string, data: CreateInput<Inventory>): Promise<string> {
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

  async updateInventoryItem(userId: string, itemId: string, data: UpdateInput<Inventory>): Promise<void> {
    const existing = await this.getInventoryItem(userId, itemId);
    if (!existing) throw new Error("Inventory item not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await updateDoc(doc(db, COLLECTION, itemId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteInventoryItem(userId: string, itemId: string): Promise<void> {
    const existing = await this.getInventoryItem(userId, itemId);
    if (!existing) throw new Error("Inventory item not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await deleteDoc(doc(db, COLLECTION, itemId));
  },

  async adjustInventoryQuantity(
    userId: string,
    itemId: string,
    delta: number
  ): Promise<number> {
    const item = await this.getInventoryItem(userId, itemId);
    if (!item) throw new Error("Inventory item not found");
    const currentQty = Number(item.quantity) || 0;
    const nextQty = currentQty + delta;
    if (nextQty < 0) throw new Error("inventory.quantityCannotBeNegative");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await updateDoc(doc(db, COLLECTION, itemId), {
      quantity: nextQty,
      updatedAt: new Date().toISOString(),
    });
    return nextQty;
  },
};
