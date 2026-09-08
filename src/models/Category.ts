import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    localId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    icon: { type: String, default: null },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    deletedAt: { type: Date, default: null },
    // See Transaction: server-side pull cursor.
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Idempotent sync: a localId is unique inside one workspace.
CategorySchema.index({ userId: 1, localId: 1 }, { unique: true });
CategorySchema.index({ userId: 1, type: 1, status: 1 });
CategorySchema.index({ userId: 1, syncedAt: -1 });

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) ??
  mongoose.model<CategoryDoc>("Category", CategorySchema);
