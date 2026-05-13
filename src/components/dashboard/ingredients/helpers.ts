import type { EditorOptionItem, EditorState } from "./types";

export const emptyEditor: EditorState = {
  id: null,
  name: "",
  slug: "",
  description: "",
  minSelections: "0",
  maxSelections: "",
  isRequired: false,
  isActive: true,
  sortOrder: "0",
  items: [],
};

export function asNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

export function totalDelta(items: EditorOptionItem[]) {
  return items.reduce((sum, item) => sum + Number(item.priceDelta || 0), 0);
}
