"use client";

import { useEffect, useRef } from "react";
import { getDb } from "@/lib/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const HEARTBEAT_INTERVAL_MS = 15_000; // 15 seconds for more live updates
const SESSION_KEY = "vn_session_id";
const CREATED_FLAG = "vn_presence_created";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function VisitorPresence() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    const writePresence = async () => {
      const db = await getDb();
      if (!db) return;
      try {
        const isFirst = !sessionStorage.getItem(CREATED_FLAG);
        const data: Record<string, unknown> = { lastSeen: serverTimestamp() };
        if (isFirst) {
          data.createdAt = serverTimestamp();
          sessionStorage.setItem(CREATED_FLAG, "1");
        }
        await setDoc(doc(db, "presence", sessionId), data, { merge: true });
      } catch {
        // Ignore errors (e.g. offline, rules)
      }
    };

    // Defer presence to avoid competing with critical listings fetch (improves LCP)
    const DEFER_MS = 4000;
    const timeoutId = setTimeout(() => {
      writePresence();
      intervalRef.current = setInterval(writePresence, HEARTBEAT_INTERVAL_MS);
    }, DEFER_MS);

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return null;
}
