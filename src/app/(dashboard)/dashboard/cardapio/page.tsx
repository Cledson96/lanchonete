import { getAdminCategories, getAdminMenuItems, getAdminOptionGroups, getAdminIngredients } from "@/lib/services/menu-service";
import { DashboardCardapioManager } from "@/components/dashboard-cardapio-manager";
import { numberFromDecimal } from "@/lib/utils";

export default async function DashboardCardapioPage() {
  const [categories, items, optionGroups, ingredients] = await Promise.all([
    getAdminCategories(),
    getAdminMenuItems(),
    getAdminOptionGroups(),
    getAdminIngredients(),
  ]);

  const browserCategories = categories.map((category) => {
    const typedCategory = category as typeof category & {
      availableFrom?: Date | null;
      availableUntil?: Date | null;
    };

    return {
      ...typedCategory,
      availableFrom: typedCategory.availableFrom ? typedCategory.availableFrom.toISOString() : null,
      availableUntil: typedCategory.availableUntil ? typedCategory.availableUntil.toISOString() : null,
    };
  });

  const browserOptionGroups = optionGroups.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      priceDelta: Number((option as { priceDelta?: unknown }).priceDelta ?? 0),
    })),
  }));

  const browserIngredients = ingredients.map((ingredient) => ({
    ...ingredient,
    price: Number((ingredient as { price?: unknown }).price ?? 0),
  }));

  const browserItems = items.map((item) => ({
    ...item,
    price: numberFromDecimal(item.price) ?? 0,
    compareAtPrice: numberFromDecimal(item.compareAtPrice),
    optionGroups: item.optionGroups.map((link) => ({
      optionGroup: {
        ...link.optionGroup,
      },
    })),
    ingredients: item.ingredients.map((link) => ({
      ingredient: {
        ...link.ingredient,
        price: Number((link.ingredient as { price?: unknown }).price ?? 0),
      },
    })),
  }));

  return (
    <DashboardCardapioManager
      categories={browserCategories}
      items={browserItems}
      optionGroups={browserOptionGroups}
      ingredients={browserIngredients}
    />
  );
}
