export type FinanceType = "income" | "expense";
export type FinanceCurrency = "GEL";
export type FinanceCategory =
  | "wine_sales"
  | "grape_sales"
  | "materials"
  | "salary"
  | "transport"
  | "utilities"
  | "other";

export interface FinanceEntry {
  id: string;
  userId: string;
  type: FinanceType;
  amount: number;
  currency: FinanceCurrency;
  category: FinanceCategory;
  date: string;
  notes?: string;
  createdAt: unknown;
}

export type CreateFinanceEntryInput = Omit<FinanceEntry, "id" | "userId" | "createdAt">;
