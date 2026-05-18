export type GearCategory =
  | "computer"
  | "phone"
  | "camera"
  | "audio"
  | "wearable"
  | "home"
  | "outdoor"
  | "tool"
  | "other";

export type GearStatus = "active" | "wishlist" | "repair" | "sold" | "retired";

export type GearDTO = {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: GearCategory | string;
  categoryLabel: string;
  status: GearStatus | string;
  statusLabel: string;
  location: string;
  serialNumber: string;
  purchaseDate: string | null;
  purchasePrice: number | null;
  currency: string;
  purchaseChannel: string;
  warrantyUntil: string | null;
  specs: Record<string, unknown>;
  notes: string;
  linkedExpenseId: string | null;
  createdAt: string;
  updatedAt: string;
  linkedExpense: {
    id: string;
    amount: number;
    currency: string;
    note: string;
    occurredAt: string;
    category: {
      id: string;
      name: string;
      emoji: string;
      color: string;
    } | null;
  } | null;
};

export type GearSummaryDTO = {
  total: number;
  active: number;
  wishlist: number;
  totalValue: number;
  byCategory: Array<{
    category: string;
    label: string;
    count: number;
    value: number;
  }>;
  warrantyExpiring: GearDTO[];
  recent: GearDTO[];
};
