"use client";

import Dexie, { type Table } from "dexie";
import type { Category, Transaction, TxType } from "@/lib/types";

/**
 * Local mirror of the user's workspace.
 *
 * Every screen reads from here, so the whole app works offline and renders
 * instantly. Writes land here first and are pushed to MongoDB by the sync
 * engine; `pending` marks rows the server has not acknowledged yet.
 */
export type LocalTransaction = Transaction & { pending: 0 | 1 };
export type LocalCategory = Category & { pending: 0 | 1 };

export type MetaRow = { key: string; value: string | null };

class WorkspaceDB extends Dexie {
  transactions!: Table<LocalTransaction, string>;
  categories!: Table<LocalCategory, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("income-expense-workspace");

    const stores = {
      transactions: "localId, date, type, updatedAt, pending, categoryId",
      categories: "localId, type, status, updatedAt, pending",
      meta: "key",
    };

    this.version(1).stores(stores);

    // v2 repairs rows written by an earlier build that could save a
    // transaction without a `type`. Those rows were rejected by the server
    // (422) and showed up in neither the income nor the expense list. The
    // category the user picked tells us which it was meant to be, because the
    // picker only ever offers categories of the matching type.
    this.version(2)
      .stores(stores)
      .upgrade(async (tx) => {
        const categories = await tx.table("categories").toArray();
        const typeByCategory = new Map<string, TxType>(
          categories.map((category) => [category.localId, category.type]),
        );

        await tx
          .table("transactions")
          .toCollection()
          .modify((row: LocalTransaction) => {
            if (row.type === "income" || row.type === "expense") return;
            row.type =
              (row.categoryId && typeByCategory.get(row.categoryId)) ||
              "expense";
            // Re-queue it so the repaired row reaches the server.
            row.pending = 1;
            row.updatedAt = new Date().toISOString();
          });
      });
  }
}

let instance: WorkspaceDB | null = null;

export function db() {
  if (!instance) instance = new WorkspaceDB();
  return instance;
}

export const META_USER_ID = "userId";
export const META_LAST_PULL = "lastPullAt";

export async function getMeta(key: string) {
  const row = await db().meta.get(key);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string | null) {
  await db().meta.put({ key, value });
}

/**
 * Local data belongs to exactly one account. When a different user signs in on
 * the same device, drop everything first so no data leaks between workspaces.
 */
export async function ensureWorkspace(userId: string) {
  const current = await getMeta(META_USER_ID);
  if (current === userId) return false;

  await db().transaction("rw", db().transactions, db().categories, db().meta, async () => {
    await db().transactions.clear();
    await db().categories.clear();
    await db().meta.clear();
    await db().meta.put({ key: META_USER_ID, value: userId });
  });
  return true;
}

export async function clearWorkspace() {
  await db().transaction("rw", db().transactions, db().categories, db().meta, async () => {
    await db().transactions.clear();
    await db().categories.clear();
    await db().meta.clear();
  });
}
