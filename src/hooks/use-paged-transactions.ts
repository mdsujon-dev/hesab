"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { inRange } from "@/lib/reports";
import type { PaymentMethod, Transaction, TxType } from "@/lib/types";

export type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export type PageQuery = {
  type?: TxType | "all";
  from?: string | null;
  to?: string | null;
  categoryId?: string | null;
  paymentMethod?: PaymentMethod | null;
  search?: string;
  sort?: SortKey;
  page: number;
  pageSize: number;
};

export type PagedResult = {
  rows: Transaction[];
  total: number;
  loading: boolean;
  error: string | null;
  /** Where the current page came from — the API, or the offline mirror. */
  source: "server" | "local";
  reload: () => void;
};

function sortRows(rows: Transaction[], sort: SortKey) {
  return [...rows].sort((a, b) => {
    switch (sort) {
      case "date-asc":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });
}

/** The same filtering the API applies, run against the local mirror. */
function filterLocal(rows: Transaction[], query: PageQuery) {
  let out =
    query.from && query.to
      ? inRange(rows, query.from, query.to)
      : rows.filter((row) => !row.deletedAt);

  if (query.type && query.type !== "all") {
    out = out.filter((row) => row.type === query.type);
  }
  if (query.categoryId) {
    out = out.filter((row) => row.categoryId === query.categoryId);
  }
  if (query.paymentMethod) {
    out = out.filter((row) => row.paymentMethod === query.paymentMethod);
  }

  const term = query.search?.trim().toLowerCase();
  if (term) {
    out = out.filter(
      (row) =>
        (row.note ?? "").toLowerCase().includes(term) ||
        (row.categoryName ?? "").toLowerCase().includes(term) ||
        String(row.amount).includes(term),
    );
  }

  return out;
}

type Loaded = {
  key: string;
  rows: Transaction[];
  total: number;
};

/**
 * Paged transactions.
 *
 * Online, pages come from `/api/transactions` so the browser only ever holds
 * one page — this is what keeps the table usable once an account has thousands
 * of records. Offline, the same query runs against the IndexedDB mirror so the
 * screen keeps working.
 *
 * Rows that have not synced yet exist only on this device, so they are merged
 * onto the first page; otherwise something you just added would vanish until
 * the next sync.
 */
export function usePagedTransactions(query: PageQuery): PagedResult {
  const { transactions, pendingIds, online, sync } = useWorkspace();

  const {
    type = "all",
    from = null,
    to = null,
    categoryId = null,
    paymentMethod = null,
    search = "",
    sort = "date-desc",
    page,
    pageSize,
  } = query;

  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((value) => value + 1), []);

  // Identifies one server query. `loading` is derived by comparing it with
  // whatever finished last, so no state has to be set inside the effect body.
  const queryKey = useMemo(
    () =>
      JSON.stringify([
        type,
        from,
        to,
        categoryId,
        search.trim(),
        sort,
        page,
        pageSize,
        nonce,
        sync.lastSyncedAt,
      ]),
    [
      type,
      from,
      to,
      categoryId,
      search,
      sort,
      page,
      pageSize,
      nonce,
      sync.lastSyncedAt,
    ],
  );

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (!online) return;

    const controller = new AbortController();
    const key = queryKey;

    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (categoryId) params.set("categoryId", categoryId);
    if (search.trim()) params.set("search", search.trim());
    params.set("sort", sort);
    params.set("limit", String(pageSize));
    params.set("skip", String((page - 1) * pageSize));

    fetch(`/api/transactions?${params.toString()}`, {
      signal: controller.signal,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed (${response.status})`);
        }
        return response.json() as Promise<{
          transactions: Transaction[];
          total: number;
        }>;
      })
      .then((body) => {
        setLoaded({ key, rows: body.transactions, total: body.total });
      })
      .catch((cause: unknown) => {
        // Superseded queries are aborted by the cleanup below, and the render
        // guard ignores any result whose key is not the current one.
        if (controller.signal.aborted) return;
        setFailed({
          key,
          message: cause instanceof Error ? cause.message : "Could not load",
        });
      });

    return () => controller.abort();
  }, [
    online,
    queryKey,
    type,
    from,
    to,
    categoryId,
    search,
    sort,
    page,
    pageSize,
  ]);

  // Anything not yet acknowledged by the server, matching the current filter.
  const pendingRows = useMemo(() => {
    if (pendingIds.size === 0) return [];
    const mine = transactions.filter((row) => pendingIds.has(row.localId));
    return sortRows(
      filterLocal(mine, {
        type,
        from,
        to,
        categoryId,
        paymentMethod,
        search,
        page,
        pageSize,
      }),
      sort,
    );
  }, [
    transactions,
    pendingIds,
    type,
    from,
    to,
    categoryId,
    paymentMethod,
    search,
    sort,
    page,
    pageSize,
  ]);

  return useMemo<PagedResult>(() => {
    if (!online) {
      const all = sortRows(
        filterLocal(transactions, {
          type,
          from,
          to,
          categoryId,
          paymentMethod,
          search,
          page,
          pageSize,
        }),
        sort,
      );
      const start = (page - 1) * pageSize;
      return {
        rows: all.slice(start, start + pageSize),
        total: all.length,
        loading: false,
        error: null,
        source: "local",
        reload,
      };
    }

    const fresh = loaded?.key === queryKey ? loaded : null;
    const error = failed?.key === queryKey ? failed.message : null;

    // Payment method is a local-only refinement: the API does not filter on it.
    const filterMethod = (rows: Transaction[]) =>
      paymentMethod
        ? rows.filter((row) => row.paymentMethod === paymentMethod)
        : rows;

    // Keep showing the previous page while the next one is in flight, so the
    // table does not blink empty between pages.
    const shown = fresh ?? loaded;
    const pendingSet = new Set(pendingRows.map((row) => row.localId));
    const serverPage = filterMethod(
      (shown?.rows ?? []).filter((row) => !pendingSet.has(row.localId)),
    );

    const rows =
      page === 1
        ? [...filterMethod(pendingRows), ...serverPage].slice(0, pageSize)
        : serverPage;

    return {
      rows,
      total: (shown?.total ?? 0) + pendingRows.length,
      loading: !fresh && !error,
      error,
      source: "server",
      reload,
    };
  }, [
    online,
    transactions,
    loaded,
    failed,
    queryKey,
    pendingRows,
    paymentMethod,
    page,
    pageSize,
    sort,
    type,
    from,
    to,
    categoryId,
    search,
    reload,
  ]);
}
