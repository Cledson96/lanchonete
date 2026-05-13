export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  availableFrom: string | null;
  availableUntil: string | null;
  isActive: boolean;
};

export type OptionGroupSummary = { id: string; name: string };

export type IngredientSummary = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type ComboComponentSummary = {
  quantity: number;
  componentMenuItem: { id: string; name: string; category: { id: string; name: string } };
};

export type MenuItemSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  kind: "simples" | "combo";
  price: number | string | { toString(): string };
  compareAtPrice?: number | string | { toString(): string } | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  category: { id: string; name: string };
  availableWeekdays?: string[];
  optionGroups: Array<{ optionGroup: { id: string; name: string } }>;
  ingredients: Array<{ ingredient: { id: string; name: string } }>;
  comboItems?: ComboComponentSummary[];
};

export type NormalizedMenuItem = Omit<MenuItemSummary, "price" | "compareAtPrice" | "comboItems"> & {
  price: number;
  compareAtPrice: number | null;
  comboItems: ComboComponentSummary[];
};

export type DashboardCardapioManagerProps = {
  categories: CategorySummary[];
  items: MenuItemSummary[];
  optionGroups: OptionGroupSummary[];
  ingredients: IngredientSummary[];
};

export type ToastState = { tone: "success" | "error"; message: string } | null;

export type CategoryEditorState = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  sortOrder: string;
  availableFrom: string;
  availableUntil: string;
  isActive: boolean;
};

export type DeleteCategoryState = {
  id: string;
  name: string;
  itemCount: number;
  strategy: "delete_items" | "move_items";
  targetCategoryId: string;
} | null;

export type EditorState = {
  id: string | null;
  categoryId: string;
  name: string;
  slug: string;
  ingredients: string;
  kind: "simples" | "combo";
  price: string;
  compareAtPrice: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: string;
  availableWeekdays: string[];
  optionGroupIds: string[];
  ingredientIds: string[];
  comboComponents: Array<{ componentMenuItemId: string; quantity: string }>;
};

export type MainTab = "items" | "categories";
export type EditorTab = "basic" | "options" | "ingredients" | "combo";
