import type { TxType } from "@/lib/types";

/** Seeded for every new workspace; users can edit or archive them later. */
export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: TxType;
  icon: string;
}> = [
  { name: "Salary", type: "income", icon: "\u{1F4BC}" },
  { name: "Business", type: "income", icon: "\u{1F3EA}" },
  { name: "Freelance", type: "income", icon: "\u{1F4BB}" },
  { name: "Investment", type: "income", icon: "\u{1F4C8}" },
  { name: "Gift", type: "income", icon: "\u{1F381}" },
  { name: "Other income", type: "income", icon: "\u{1F4B0}" },
  { name: "Food", type: "expense", icon: "\u{1F37D}\u{FE0F}" },
  { name: "Transport", type: "expense", icon: "\u{1F68C}" },
  { name: "Rent", type: "expense", icon: "\u{1F3E0}" },
  { name: "Utilities", type: "expense", icon: "\u{1F4A1}" },
  { name: "Groceries", type: "expense", icon: "\u{1F6D2}" },
  { name: "Health", type: "expense", icon: "\u{1F48A}" },
  { name: "Education", type: "expense", icon: "\u{1F4DA}" },
  { name: "Shopping", type: "expense", icon: "\u{1F455}" },
  { name: "Mobile and Internet", type: "expense", icon: "\u{1F4F1}" },
  { name: "Entertainment", type: "expense", icon: "\u{1F3AC}" },
  { name: "Other expense", type: "expense", icon: "\u{1F4B8}" },
];
