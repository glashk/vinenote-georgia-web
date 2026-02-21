"use client";

import { useState } from "react";
import { getDb } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function MessagesClient() {
  const [chats, setChats] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    let unsub: (() => void) | undefined;

    getDb().then((db) => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, orderBy("updatedAt", "desc"));

        unsub = onSnapshot(
          q,
          (snap) => {
            setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
          },
          () => {
            setChats([]);
            setLoading(false);
          }
        );
      } catch {
        setChats([]);
        setLoading(false);
      }
    });

    return () => unsub?.();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Messaging Oversight
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          View and moderate chat conversations
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Note:</strong> Messaging requires a <code>chats</code> or{" "}
          <code>conversations</code> collection in Firestore. If your React Native
          app uses a different schema, wire this page to your chat collections.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            Search by user
          </label>
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="User ID or nickname"
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            Search by keyword
          </label>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Keyword in message"
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
          Shadow mute
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          When enabled, messages from the user are sent but hidden from other
          participants. Requires Cloud Function or client-side logic to enforce.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          No chats found. Connect this page to your app&apos;s chat collection.
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat: { id?: string; [key: string]: unknown }) => (
            <div
              key={chat.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="font-medium">Chat {chat.id}</div>
              <pre className="text-xs text-slate-500 mt-1 overflow-auto">
                {JSON.stringify(chat, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
