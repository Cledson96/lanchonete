import type {
  CategoryEditorState,
  CategorySummary,
  EditorState,
  MenuItemSummary,
  NormalizedMenuItem,
} from "./types";

export const emptyEditorState: EditorState = {
  id: null,
  categoryId: "",
  name: "",
  slug: "",
  ingredients: "",
  kind: "simples",
  price: "",
  compareAtPrice: "",
  isActive: true,
  isFeatured: false,
  sortOrder: "0",
  availableWeekdays: [],
  optionGroupIds: [],
  ingredientIds: [],
  comboComponents: [],
};

export const emptyCategoryEditorState: CategoryEditorState = {
  id: null,
  name: "",
  slug: "",
  description: "",
  sortOrder: "0",
  availableFrom: "",
  availableUntil: "",
  isActive: true,
};

export function asNumber(value: MenuItemSummary["price"] | MenuItemSummary["compareAtPrice"]) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value.toString());
}

export function normalizeItem(item: MenuItemSummary): NormalizedMenuItem {
  return {
    ...item,
    price: asNumber(item.price) ?? 0,
    compareAtPrice: asNumber(item.compareAtPrice),
    optionGroups: item.optionGroups || [],
    ingredients: item.ingredients || [],
    comboItems: item.comboItems || [],
  };
}

export function createEditorStateFromItem(item: NormalizedMenuItem): EditorState {
  return {
    id: item.id,
    categoryId: item.category.id,
    name: item.name,
    slug: item.slug,
    ingredients: item.description || "",
    kind: item.kind,
    price: String(item.price),
    compareAtPrice: item.compareAtPrice != null ? String(item.compareAtPrice) : "",
    isActive: item.isActive,
    isFeatured: item.isFeatured,
    sortOrder: String(item.sortOrder ?? 0),
    availableWeekdays: item.availableWeekdays || [],
    optionGroupIds: (item.optionGroups || []).map((g) => g.optionGroup.id),
    ingredientIds: (item.ingredients || []).map((l) => l.ingredient.id),
    comboComponents: (item.comboItems || []).map((c) => ({
      componentMenuItemId: c.componentMenuItem.id,
      quantity: String(c.quantity),
    })),
  };
}

export function createNewEditorState(categories: CategorySummary[]): EditorState {
  return { ...emptyEditorState, categoryId: categories[0]?.id || "" };
}

export function toggleWeekday(list: string[], weekday: string) {
  return list.includes(weekday) ? list.filter((i) => i !== weekday) : [...list, weekday];
}
