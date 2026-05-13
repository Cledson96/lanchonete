export type OptionItemSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceDelta: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type OptionGroupSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  minSelections: number;
  maxSelections: number | null;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  options: OptionItemSummary[];
};

export type DashboardIngredientManagerProps = { optionGroups: OptionGroupSummary[] };

export type EditorOptionItem = {
  id?: string;
  name: string;
  priceDelta: string;
  isDefault: boolean;
  isActive: boolean;
};

export type EditorState = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  minSelections: string;
  maxSelections: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: string;
  items: EditorOptionItem[];
};

export type DeleteState = { id: string; name: string; optionCount: number } | null;
export type StatusFilter = "all" | "active" | "inactive";
export type ToastState = { tone: "success" | "error"; message: string } | null;
