export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  categoryName: string;
  categoryAvailability?: {
    availableFrom?: string | null;
    availableUntil?: string | null;
  };
  quantity: number;
  notes?: string | null;
  optionItemIds?: string[];
  optionNames?: string[];
  optionDelta?: number;
  ingredientCustomizations?: Record<string, number>;
  ingredientNames?: Record<string, string>;
};
