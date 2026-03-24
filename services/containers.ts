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
import type { Container, CreateInput, UpdateInput } from "@/types/firestore";

const COLLECTION = "containers";

export const containersService = {
  async getContainer(userId: string, containerId: string): Promise<Container | null> {
    const db = await getDb();
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTION, containerId));
      if (!snap.exists()) return null;
      const data = { id: snap.id, ...snap.data() } as Container;
      if (data.userId !== userId) return null;
      return data;
    } catch (e) {
      console.error("getContainer error:", e);
      return null;
    }
  },

  async getUserContainers(userId: string): Promise<Container[]> {
    const db = await getDb();
    if (!db) return [];
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTION), where("userId", "==", userId))
      );
      const containers = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Container[];
      return containers.sort((a, b) => {
        const aT = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
        const bT = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
        return bT - aT;
      });
    } catch (e) {
      console.error("getUserContainers error:", e);
      return [];
    }
  },

  async createContainer(userId: string, data: CreateInput<Container>): Promise<string> {
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

  async updateContainer(userId: string, containerId: string, data: UpdateInput<Container>): Promise<void> {
    const existing = await this.getContainer(userId, containerId);
    if (!existing) throw new Error("Container not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await updateDoc(doc(db, COLLECTION, containerId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteContainer(userId: string, containerId: string): Promise<void> {
    const existing = await this.getContainer(userId, containerId);
    if (!existing) throw new Error("Container not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await deleteDoc(doc(db, COLLECTION, containerId));
  },
};
