import type { PaymentMethod } from "@/lib/comanda-ui";

export type CreateModalState = {
  open: boolean;
  name: string;
  notes: string;
  error: string | null;
  loading: boolean;
};

export type AddComandaItemInput = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  optionItemIds: string[];
  ingredientCustomizations?: Record<string, number>;
};

export type ClosingPaymentMethod = Exclude<PaymentMethod, null>;
