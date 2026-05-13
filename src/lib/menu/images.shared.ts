export const MENU_ITEM_PLACEHOLDER_URL = "/landing/menu-item-placeholder.webp";

export function resolveMenuItemImage(imageUrl?: string | null) {
  return imageUrl || MENU_ITEM_PLACEHOLDER_URL;
}
