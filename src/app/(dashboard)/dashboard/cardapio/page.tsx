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

  return (
    <DashboardCardapioManager
      categories={categories}
      items={items.map((item) => ({
        ...item,
        price: numberFromDecimal(item.price) ?? 0,
        compareAtPrice: numberFromDecimal(item.compareAtPrice),
      }))}
      optionGroups={optionGroups}
      ingredients={ingredients}
    />
  );
}
