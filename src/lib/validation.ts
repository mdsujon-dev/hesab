import * as z from "zod";

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    error: "Invalid date",
  });

export const registerSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters" }).trim(),
  email: z.email({ error: "Enter a valid email" }).trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{6,20}$/, { error: "Enter a valid phone number" })
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { error: "Include at least one letter" })
    .regex(/[0-9]/, { error: "Include at least one number" }),
});

export const loginSchema = z.object({
  // Accepts either an email address or a phone number.
  identifier: z.string().min(3, { error: "Enter your email or phone" }).trim(),
  password: z.string().min(1, { error: "Enter your password" }),
});

export const profileSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters" }).trim(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{6,20}$/, { error: "Enter a valid phone number" })
    .optional()
    .or(z.literal("")),
  currency: z.string().min(1).max(8).default("BDT"),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { error: "Enter your current password" }),
  newPassword: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { error: "Include at least one letter" })
    .regex(/[0-9]/, { error: "Include at least one number" }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Enter a valid email" }).trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, { error: "This reset link is not valid" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { error: "Include at least one letter" })
    .regex(/[0-9]/, { error: "Include at least one number" }),
});

export const transactionSchema = z.object({
  localId: z.string().min(1).max(80),
  type: z.enum(["income", "expense"]),
  amount: z.coerce
    .number()
    .positive({ error: "Amount must be greater than 0" })
    .max(1_000_000_000),
  categoryId: z.string().max(80).nullable().optional(),
  categoryName: z.string().max(80).nullable().optional(),
  date: isoDate,
  note: z.string().max(500).default(""),
  paymentMethod: z
    .enum(["cash", "card", "bank", "mobile", "other"])
    .default("cash"),
  createdAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  deletedAt: isoDate.nullable().optional(),
});

export const transactionPatchSchema = transactionSchema
  .partial()
  .omit({ localId: true });

export const categorySchema = z.object({
  localId: z.string().min(1).max(80),
  name: z.string().min(1, { error: "Name is required" }).max(60).trim(),
  type: z.enum(["income", "expense"]),
  icon: z.string().max(16).nullable().optional(),
  status: z.enum(["active", "archived"]).default("active"),
  createdAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  deletedAt: isoDate.nullable().optional(),
});

export const categoryPatchSchema = categorySchema
  .partial()
  .omit({ localId: true });

export const syncSchema = z.object({
  /** Everything changed locally since the last successful push. */
  transactions: z.array(transactionSchema).max(500).default([]),
  categories: z.array(categorySchema).max(500).default([]),
  /** ISO timestamp of the last pull; server returns anything newer. */
  since: isoDate.nullable().optional(),
});

export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors;
}
