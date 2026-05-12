export type PublicMenuOption = {
  id: string;
  name: string;
  description?: string | null;
  priceDelta: number;
};

export type PublicMenuOptionGroup = {
  id: string;
  name: string;
  description?: string | null;
  minSelections: number;
  maxSelections?: number | null;
  isRequired: boolean;
  options: PublicMenuOption[];
};

export type PublicMenuIngredient = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export type PublicMenuItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  compareAtPrice?: number | null;
  availableWeekdays: string[];
  optionGroups: PublicMenuOptionGroup[];
  ingredients: PublicMenuIngredient[];
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  menuItems: PublicMenuItem[];
};

export type PublicMenuResponse = {
  categories: PublicMenuCategory[];
};
