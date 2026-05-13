import { getAdminOptionGroups } from "@/lib/services/menu-service";
import { numberFromDecimal } from "@/lib/db/decimal";
import { DashboardIngredientManager } from "@/components/dashboard/ingredient-manager";

export default async function DashboardIngredientesPage() {
  const optionGroups = await getAdminOptionGroups();

  return (
    <DashboardIngredientManager
      optionGroups={optionGroups.map((group) => ({
        ...group,
        options: group.options.map((option) => ({
          ...option,
          priceDelta: numberFromDecimal(option.priceDelta) ?? 0,
        })),
      }))}
    />
  );
}
