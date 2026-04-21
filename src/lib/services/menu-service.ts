import { prisma } from "@/lib/prisma";
import { isMenuItemAvailableNow } from "@/lib/menu-item-availability";
import { isCategoryAvailableNow } from "@/lib/category-availability";
import { SimpleCache } from "@/lib/simple-cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicMenuCache = new SimpleCache<any[]>(30_000);

export function invalidatePublicMenuCache(): void {
  publicMenuCache.invalidate("menu");
}

export async function getPublicMenu() {
  const cached = publicMenuCache.get("menu");
  if (cached) return cached;

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      menuItems: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          comboItems: {
            orderBy: [{ sortOrder: "asc" }, { componentMenuItem: { name: "asc" } }],
            include: {
              componentMenuItem: true,
            },
          },
          optionGroups: {
            orderBy: { sortOrder: "asc" },
            include: {
              optionGroup: {
                include: {
                  options: {
                    where: { isActive: true },
                    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                  },
                },
              },
            },
          },
          ingredients: {
            orderBy: { sortOrder: "asc" },
            include: {
              ingredient: true,
            },
          },
        },
      },
    },
  });

  const result = categories
    .filter((category) => isCategoryAvailableNow(category as { availableFrom?: string | null; availableUntil?: string | null }))
    .map((category) => ({
      ...category,
      menuItems: category.menuItems
        .filter((item) => isMenuItemAvailableNow(item as { availableWeekdays?: string[] | null }))
        .map((item) => ({
          ...item,
          optionGroups: item.optionGroups.map((link) => link.optionGroup),
          ingredients: item.ingredients
            .filter((link) => link.ingredient?.isActive)
            .map((link) => ({
              id: link.ingredient.id,
              name: link.ingredient.name,
              quantity: link.quantity,
              price: Number((link.ingredient as { price?: unknown }).price ?? 0),
            })),
        })),
    }))
    .filter((category) => category.menuItems.length > 0);

  publicMenuCache.set("menu", result);
  return result;
}

export async function getAdminCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getAdminMenuItems() {
  return prisma.menuItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      category: true,
      comboItems: {
        orderBy: [{ sortOrder: "asc" }, { componentMenuItem: { name: "asc" } }],
        include: {
          componentMenuItem: {
            include: {
              category: true,
            },
          },
        },
      },
      optionGroups: {
        include: {
          optionGroup: true,
        },
      },
      ingredients: {
        orderBy: { sortOrder: "asc" },
        include: {
          ingredient: true,
        },
      },
    },
  });
}

export async function getAdminIngredients() {
  return prisma.ingredient.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getAdminOptionGroups() {
  return prisma.optionGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      options: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}
