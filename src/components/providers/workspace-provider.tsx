"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  ensureWorkspace,
  clearWorkspace,
  type LocalTransaction,
} from "@/offline/db";
import {
  getSyncState,
  startSyncEngine,
  subscribeSync,
  syncNow,
  type SyncState,
} from "@/offline/sync";
import type { Category, SessionUser, Transaction } from "@/lib/types";

type WorkspaceValue = {
  user: SessionUser;
  transactions: Transaction[];
  categories: Category[];
  /** Local ids not yet acknowledged by the server. */
  pendingIds: Set<string>;
  /** Undefined until the first IndexedDB read resolves. */
  loading: boolean;
  sync: SyncState;
  online: boolean;
  syncNow: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: SessionUser) => void;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return value;
}

export function WorkspaceProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>(getSyncState);
  const [online, setOnline] = useState(true);

  // Bind the local database to this account, then start the sync engine.
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      await ensureWorkspace(initialUser.id);
      if (cancelled) return;
      setReady(true);
      stop = startSyncEngine();
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [initialUser.id]);

  useEffect(() => subscribeSync(setSync), []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // The session can expire while the tab is open; bounce to login when it does.
  useEffect(() => {
    if (sync.error === "Signed out") router.replace("/login");
  }, [sync.error, router]);

  const localTransactions = useLiveQuery(
    async () => {
      const rows = await db().transactions.toArray();
      return rows.filter((row) => !row.deletedAt);
    },
    [ready],
    undefined,
  );

  const transactions = localTransactions as Transaction[] | undefined;

  const pendingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of (localTransactions ?? []) as LocalTransaction[]) {
      if (row.pending === 1) ids.add(row.localId);
    }
    return ids;
  }, [localTransactions]);

  const categories = useLiveQuery(
    async () => {
      const rows = await db().categories.toArray();
      return rows
        .filter((row) => !row.deletedAt && row.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name)) as Category[];
    },
    [ready],
    undefined,
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await clearWorkspace();
    router.replace("/login");
    router.refresh();
  }, [router]);

  const value = useMemo<WorkspaceValue>(
    () => ({
      user,
      transactions: transactions ?? [],
      categories: categories ?? [],
      pendingIds,
      loading: !ready || transactions === undefined || categories === undefined,
      sync,
      online,
      syncNow,
      signOut,
      setUser,
    }),
    [user, transactions, categories, pendingIds, ready, sync, online, signOut],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
