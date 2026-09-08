import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    localId: { type: String, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: String, default: null },
    categoryName: { type: String, default: null },
    date: { type: Date, required: true },
    note: { type: String, default: "", trim: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank", "mobile", "other"],
      default: "cash",
    },
    deletedAt: { type: Date, default: null },
    // Server-side clock used as the pull cursor. `updatedAt` is the client's
    // logical version (last-write-wins), which can lag or skew; `syncedAt` is
    // always set by this server so other devices never miss a change.
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Recommended indexes from the spec.
TransactionSchema.index({ userId: 1, localId: 1 }, { unique: true });
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, syncedAt: -1 });

export type TransactionDoc = InferSchemaType<typeof TransactionSchema>;

export const Transaction: Model<TransactionDoc> =
  (mongoose.models.Transaction as Model<TransactionDoc>) ??
  mongoose.model<TransactionDoc>("Transaction", TransactionSchema);
