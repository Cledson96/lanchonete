import { getAdminCategories, getAdminMenuItems, getAdminOptionGroups } from "@/lib/services/menu-service";
import { DashboardCardapioManager } from "@/components/dashboard-cardapio-manager";
import { numberFromDecimal } from "@/lib/utils";

export default async function DashboardCardapioPage() {
  const [categories, items, optionGroups] = await Promise.all([
    getAdminCategories(),
    getAdminMenuItems(),
    getAdminOptionGroups(),
  ]);

  return (
    <DashboardCardapioManager
      categories={categories}
      items={items.map((item) => ({
        ...item,
        price: numberFromDecimal(item.price) ?? 0,
      }))}
      optionGroups={optionGroups}
    />
  );
}
