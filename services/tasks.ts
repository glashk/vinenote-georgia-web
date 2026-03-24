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
import type { Task, CreateInput, UpdateInput } from "@/types/firestore";

const COLLECTION = "tasks";

export const tasksService = {
  async getTask(userId: string, taskId: string): Promise<Task | null> {
    const db = await getDb();
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTION, taskId));
      if (!snap.exists()) return null;
      const data = { id: snap.id, ...snap.data() } as Task;
      if (data.userId !== userId) return null;
      return data;
    } catch (e) {
      console.error("getTask error:", e);
      return null;
    }
  },

  async getUserTasks(userId: string): Promise<Task[]> {
    const db = await getDb();
    if (!db) return [];
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTION), where("userId", "==", userId))
      );
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
      return tasks.sort((a, b) => {
        const aT = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
        const bT = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
        return bT - aT;
      });
    } catch (e) {
      console.error("getUserTasks error:", e);
      return [];
    }
  },

  async createTask(userId: string, data: CreateInput<Task>): Promise<string> {
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

  async updateTask(userId: string, taskId: string, data: UpdateInput<Task>): Promise<void> {
    const existing = await this.getTask(userId, taskId);
    if (!existing) throw new Error("Task not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await updateDoc(doc(db, COLLECTION, taskId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const existing = await this.getTask(userId, taskId);
    if (!existing) throw new Error("Task not found");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await deleteDoc(doc(db, COLLECTION, taskId));
  },
};
