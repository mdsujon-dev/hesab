"use client";

import { db, type LocalCategory, type LocalTransaction } from "@/offline/db";
import { newLocalId } from "@/lib/utils";
import type { Category, PaymentMethod, Transaction, TxType } from "@/lib/types";
import { requestSync } from "@/offline/sync";

/**
 * Local-first writes. Every mutation updates IndexedDB immediately (so the UI
 * responds with no network round-trip), marks the row pending, and nudges the
 * sync engine. Offline, the nudge is a no-op and the row waits.
 */

export type TransactionInput = {
  type: TxType;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  date: string;
  note: string;
  paymentMethod: PaymentMethod;
};

export async function createTransaction(input: TransactionInput) {
  // A transaction with no type is unusable: it belongs to neither list and the
  // server rejects it. Fail loudly here rather than writing a broken row.
  if (input.type !== "income" && input.type !== "expense") {
    throw new Error("Transaction type must be income or expense");
  }

  const now = new Date().toISOString();
  const row: LocalTransaction = {
    localId: newLocalId(),
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    date: input.date,
    note: input.note,
    paymentMethod: input.paymentMethod,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    pending: 1,
  };
  await db().transactions.put(row);
  requestSync();
  return row;
}

export async function updateTransaction(
  localId: string,
  patch: Partial<TransactionInput>,
) {
  const existing = await db().transactions.get(localId);
  if (!existing) return null;

  const row: LocalTransaction = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
    pending: 1,
  };

  if (row.type !== "income" && row.type !== "expense") {
    throw new Error("Transaction type must be income or expense");
  }

  await db().transactions.put(row);
  requestSync();
  return row;
}

/** Soft delete, so the tombstone can reach the server and other devices. */
export async function deleteTransaction(localId: string) {
  const existing = await db().transactions.get(localId);
  if (!existing) return;

  const now = new Date().toISOString();
  await db().transactions.put({
    ...existing,
    deletedAt: now,
    updatedAt: now,
    pending: 1,
  });
  requestSync();
}

export async function createCategory(input: {
  name: string;
  type: TxType;
  icon: string | null;
}) {
  const now = new Date().toISOString();
  const row: LocalCategory = {
    localId: newLocalId(),
    name: input.name,
    type: input.type,
    icon: input.icon,
    status: "active",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    pending: 1,
  };
  await db().categories.put(row);
  requestSync();
  return row;
}

export async function updateCategory(
  localId: string,
  patch: Partial<Pick<Category, "name" | "type" | "icon" | "status">>,
) {
  const existing = await db().categories.get(localId);
  if (!existing) return null;

  const row: LocalCategory = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
    pending: 1,
  };
  await db().categories.put(row);
  requestSync();
  return row;
}

export async function deleteCategory(localId: string) {
  const existing = await db().categories.get(localId);
  if (!existing) return;

  const now = new Date().toISOString();
  await db().categories.put({
    ...existing,
    deletedAt: now,
    updatedAt: now,
    pending: 1,
  });
  requestSync();
}

/** Live-query helpers: all reads filter tombstones out. */
export async function listTransactions(): Promise<Transaction[]> {
  const rows = await db().transactions.toArray();
  return rows.filter((row) => !row.deletedAt);
}

export async function listCategories(): Promise<Category[]> {
  const rows = await db().categories.toArray();
  return rows
    .filter((row) => !row.deletedAt && row.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
}
