import "server-only";
import type { Category, Transaction } from "@/lib/types";

type Lean = Record<string, unknown>;

const iso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();

export function serializeTransaction(doc: Lean): Transaction {
  return {
    localId: String(doc.localId),
    serverId: String(doc._id),
    type: doc.type as Transaction["type"],
    amount: Number(doc.amount),
    categoryId: (doc.categoryId as string | null) ?? null,
    categoryName: (doc.categoryName as string | null) ?? null,
    date: iso(doc.date),
    note: (doc.note as string) ?? "",
    paymentMethod: (doc.paymentMethod as Transaction["paymentMethod"]) ?? "cash",
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
    deletedAt: doc.deletedAt ? iso(doc.deletedAt) : null,
  };
}

export function serializeCategory(doc: Lean): Category {
  return {
    localId: String(doc.localId),
    serverId: String(doc._id),
    name: String(doc.name),
    type: doc.type as Category["type"],
    icon: (doc.icon as string | null) ?? null,
    status: (doc.status as Category["status"]) ?? "active",
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
    deletedAt: doc.deletedAt ? iso(doc.deletedAt) : null,
  };
}
