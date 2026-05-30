/**
 * Listing view & phone-click analytics (Firestore increment + optional events).
 */

const VIEW_STORAGE_KEY = "memarne_listing_views_v1";
const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type ViewRecord = Record<string, number>;

function readViewRecords(): ViewRecord {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ViewRecord;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeViewRecords(records: ViewRecord): void {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const pruned: ViewRecord = {};
    for (const [id, ts] of Object.entries(records)) {
      if (now - ts < VIEW_COOLDOWN_MS) pruned[id] = ts;
    }
    localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    // ignore quota / private mode
  }
}

/** Mask phone for public display until user reveals. */
export function maskPhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length <= 4) return "***";

  if (digits.startsWith("995") && digits.length >= 12) {
    const local = digits.slice(3, 12);
    const prefix = local.slice(0, 3);
    return `+995 ${prefix} *** ***`;
  }

  if (trimmed.startsWith("+")) {
    const visibleLen = Math.min(6, Math.max(3, digits.length - 6));
    const visible = digits.slice(0, visibleLen);
    return `+${visible} *** ***`;
  }

  if (digits.length >= 9) {
    return `${digits.slice(0, 3)} *** ***`;
  }

  return `${digits.slice(0, 2)} *** **`;
}

export function getListingViewsCount(
  listing: { viewsCount?: number | null } | null | undefined
): number {
  const n = listing?.viewsCount;
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function getListingPhoneClicksCount(
  listing: { phoneClicksCount?: number | null } | null | undefined
): number {
  const n = listing?.phoneClicksCount;
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function getConversionRate(
  viewsCount: number,
  phoneClicksCount: number
): number {
  if (viewsCount <= 0) return 0;
  return Math.round((phoneClicksCount / viewsCount) * 1000) / 10;
}

export function shouldCountListingView(
  listingId: string,
  listingOwnerId: string | undefined | null,
  currentUserId: string | undefined | null
): boolean {
  if (!listingId) return false;
  if (
    currentUserId &&
    listingOwnerId &&
    currentUserId === listingOwnerId
  ) {
    return false;
  }

  const records = readViewRecords();
  const last = records[listingId];
  if (last && Date.now() - last < VIEW_COOLDOWN_MS) return false;
  return true;
}

export function markListingViewedLocally(listingId: string): void {
  const records = readViewRecords();
  records[listingId] = Date.now();
  writeViewRecords(records);
}

async function getFirestore() {
  const { getDb } = await import("@/lib/firebase-app");
  const [
    { doc, updateDoc, increment, serverTimestamp, collection, addDoc },
  ] = await Promise.all([import("firebase/firestore")]);
  const db = await getDb();
  return { db, doc, updateDoc, increment, serverTimestamp, collection, addDoc };
}

async function writeAnalyticsEvent(
  listingId: string,
  listingOwnerId: string | undefined | null,
  type: "view" | "phone_click",
  userId: string | undefined | null
): Promise<void> {
  try {
    const { db, collection, addDoc, serverTimestamp } = await getFirestore();
    if (!db) return;
    await addDoc(collection(db, "marketListings", listingId, "analyticsEvents"), {
      type,
      listingId,
      listingOwnerId: listingOwnerId ?? null,
      userId: userId ?? null,
      createdAt: serverTimestamp(),
      userAgent:
        typeof navigator !== "undefined"
          ? navigator.userAgent.slice(0, 256)
          : null,
    });
  } catch {
    // optional subcollection — ignore failures
  }
}

export async function incrementListingView(
  listingId: string,
  listingOwnerId: string | undefined | null,
  currentUserId?: string | null
): Promise<boolean> {
  if (!shouldCountListingView(listingId, listingOwnerId, currentUserId ?? null)) {
    return false;
  }

  markListingViewedLocally(listingId);

  try {
    const { db, doc, updateDoc, increment, serverTimestamp } =
      await getFirestore();
    if (!db) return false;

    await updateDoc(doc(db, "marketListings", listingId), {
      viewsCount: increment(1),
      lastViewedAt: serverTimestamp(),
    });

    void writeAnalyticsEvent(
      listingId,
      listingOwnerId,
      "view",
      currentUserId ?? null
    );
    return true;
  } catch (err) {
    console.warn("[analytics] incrementListingView failed:", err);
    return false;
  }
}

export async function incrementPhoneClick(
  listingId: string,
  listingOwnerId: string | undefined | null,
  currentUserId?: string | null
): Promise<boolean> {
  try {
    const { db, doc, updateDoc, increment, serverTimestamp } =
      await getFirestore();
    if (!db) return false;

    await updateDoc(doc(db, "marketListings", listingId), {
      phoneClicksCount: increment(1),
      lastPhoneClickedAt: serverTimestamp(),
    });

    void writeAnalyticsEvent(
      listingId,
      listingOwnerId,
      "phone_click",
      currentUserId ?? null
    );
    return true;
  } catch (err) {
    console.warn("[analytics] incrementPhoneClick failed:", err);
    return false;
  }
}
