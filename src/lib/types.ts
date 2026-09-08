export type TxType = "income" | "expense";

export type PaymentMethod = "cash" | "card" | "bank" | "mobile" | "other";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "card",
  "bank",
  "mobile",
  "other",
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  bank: "Bank",
  mobile: "Mobile banking",
  other: "Other",
};

/** Shape shared by the local (Dexie) mirror and the server API. */
export type Transaction = {
  localId: string;
  serverId?: string | null;
  type: TxType;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  /** ISO date string (yyyy-mm-dd based, stored full ISO). */
  date: string;
  note: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Category = {
  localId: string;
  serverId?: string | null;
  name: string;
  type: TxType;
  icon: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  currency: string;
};

export type Totals = {
  income: number;
  expense: number;
  balance: number;
};
