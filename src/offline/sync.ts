"use client";

import {
  META_LAST_PULL,
  db,
  getMeta,
  setMeta,
  type LocalCategory,
  type LocalTransaction,
} from "@/offline/db";
import type { Category, Transaction } from "@/lib/types";

export type SyncState = {
  status: "idle" | "syncing" | "offline" | "error";
  lastSyncedAt: string | null;
  pending: number;
  error: string | null;
};

type Listener = (state: SyncState) => void;

let state: SyncState = {
  status: "idle",
  lastSyncedAt: null,
  pending: 0,
  error: null,
};

const listeners = new Set<Listener>();
let inFlight: Promise<void> | null = null;
let queuedAgain = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 5000;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function getSyncState() {
  return state;
}

export function subscribeSync(listener: Listener) {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

function emit(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener(state);
}

async function countPending() {
  const [tx, cat] = await Promise.all([
    db().transactions.where("pending").equals(1).count(),
    db().categories.where("pending").equals(1).count(),
  ]);
  return tx + cat;
}

export async function refreshPendingCount() {
  emit({ pending: await countPending() });
}

/** Debounced trigger used by every local write. */
export function requestSync() {
  void refreshPendingCount();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void syncNow();
  }, 800);
}

export async function syncNow(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    emit({ status: "offline", pending: await countPending() });
    return;
  }

  // Collapse concurrent calls; remember that another round is wanted.
  if (inFlight) {
    queuedAgain = true;
    return inFlight;
  }

  inFlight = runSync().finally(() => {
    inFlight = null;
    if (queuedAgain) {
      queuedAgain = false;
      void syncNow();
    }
  });

  return inFlight;
}

async function runSync() {
  emit({ status: "syncing", error: null });

  try {
    const [pendingTx, pendingCat, since] = await Promise.all([
      db().transactions.where("pending").equals(1).toArray(),
      db().categories.where("pending").equals(1).toArray(),
      getMeta(META_LAST_PULL),
    ]);

    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions: pendingTx.map(stripLocalFields),
        categories: pendingCat.map(stripLocalFields),
        since,
      }),
    });

    if (response.status === 401) {
      // Session expired: stop retrying, the app shell will redirect to login.
      emit({ status: "error", error: "Signed out" });
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new SyncError(
        body?.error ?? `Sync failed (${response.status})`,
        response.status,
      );
      throw error;
    }

    const payload = (await response.json()) as {
      serverTime: string;
      transactions: Transaction[];
      categories: Category[];
    };

    await applyServerChanges(payload.transactions, payload.categories);
    await clearPending(pendingTx, pendingCat);
    await setMeta(META_LAST_PULL, payload.serverTime);

    retryDelay = 5000;
    emit({
      status: "idle",
      lastSyncedAt: payload.serverTime,
      error: null,
      pending: await countPending(),
    });
  } catch (error) {
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    const message =
      error instanceof Error ? error.message : "Could not reach the server";

    emit({
      status: offline ? "offline" : "error",
      error: offline ? null : message,
      pending: await countPending(),
    });

    // Safe retry with backoff; pending rows stay pending so nothing is lost.
    // A 4xx means the server rejected the payload itself, so an immediate
    // retry would just fail the same way — leave it to the next natural
    // trigger (interval, tab focus, reconnect) instead of a tight loop.
    const rejected =
      error instanceof SyncError &&
      error.status >= 400 &&
      error.status < 500 &&
      error.status !== 429;

    if (!offline && !rejected) scheduleRetry();
  }
}

class SyncError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function scheduleRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryDelay = Math.min(retryDelay * 2, 60_000);
    void syncNow();
  }, retryDelay);
}

function stripLocalFields<T extends { pending: 0 | 1 }>(row: T) {
  const rest: Partial<T> = { ...row };
  delete rest.pending;
  return rest;
}

/**
 * Marks rows clean only when they were not edited while the push was in
 * flight — comparing `updatedAt` avoids losing a change made mid-sync.
 */
async function clearPending(
  pushedTx: LocalTransaction[],
  pushedCat: LocalCategory[],
) {
  await db().transaction("rw", db().transactions, db().categories, async () => {
    for (const row of pushedTx) {
      const current = await db().transactions.get(row.localId);
      if (current && current.updatedAt === row.updatedAt) {
        await db().transactions.put({ ...current, pending: 0 });
      }
    }
    for (const row of pushedCat) {
      const current = await db().categories.get(row.localId);
      if (current && current.updatedAt === row.updatedAt) {
        await db().categories.put({ ...current, pending: 0 });
      }
    }
  });
}

/** Last-write-wins: a pulled row only replaces an older local row. */
async function applyServerChanges(
  transactions: Transaction[],
  categories: Category[],
) {
  await db().transaction("rw", db().transactions, db().categories, async () => {
    for (const incoming of transactions) {
      const current = await db().transactions.get(incoming.localId);
      if (current && new Date(current.updatedAt) > new Date(incoming.updatedAt)) {
        continue;
      }
      await db().transactions.put({ ...incoming, pending: 0 });
    }

    for (const incoming of categories) {
      const current = await db().categories.get(incoming.localId);
      if (current && new Date(current.updatedAt) > new Date(incoming.updatedAt)) {
        continue;
      }
      await db().categories.put({ ...incoming, pending: 0 });
    }
  });
}

/** Full refresh, used right after login on a fresh device. */
export async function pullAll() {
  await setMeta(META_LAST_PULL, null);
  await syncNow();
}

let wired = false;

/** Reconnect, tab-focus and interval triggers. Installed once per page load. */
export function startSyncEngine() {
  if (wired || typeof window === "undefined") return () => {};
  wired = true;

  const onOnline = () => {
    emit({ status: "idle" });
    void syncNow();
  };
  const onOffline = () => emit({ status: "offline" });
  const onVisible = () => {
    if (document.visibilityState === "visible") void syncNow();
  };

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisible);
  const interval = setInterval(() => void syncNow(), 60_000);

  if (!navigator.onLine) emit({ status: "offline" });
  void syncNow();

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("visibilitychange", onVisible);
    clearInterval(interval);
    wired = false;
  };
}
