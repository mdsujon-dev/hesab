import "server-only";
import { connectDB } from "@/lib/db";
import { serializeTransaction } from "@/lib/serialize";
import { Transaction } from "@/models/Transaction";
import type { Transaction as Tx } from "@/lib/types";

/**
 * Loads one user's non-deleted transactions inside a date range.
 * Range bounds are interpreted in the server's timezone, matching the
 * date keys the report engine produces.
 */
export async function loadRange(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<Tx[]> {
  await connectDB();
  const docs = await Transaction.find({
    userId,
    deletedAt: null,
    date: {
      $gte: new Date(`${fromKey}T00:00:00`),
      $lte: new Date(`${toKey}T23:59:59.999`),
    },
  })
    .sort({ date: -1 })
    .lean();

  return docs.map(serializeTransaction);
}

export function badRange(fromKey?: string | null, toKey?: string | null) {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!fromKey || !toKey) return "from and to are required (yyyy-mm-dd)";
  if (!pattern.test(fromKey) || !pattern.test(toKey)) {
    return "from and to must be yyyy-mm-dd";
  }
  if (fromKey > toKey) return "from must be on or before to";
  return null;
}
