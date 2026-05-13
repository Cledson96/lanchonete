import { prisma } from "@/lib/prisma";
import type { PublicMenuCategory, PublicMenuItem } from "@/lib/contracts/menu";
import { isMenuItemAvailableNow } from "@/lib/menu-item-availability";
import { isCategoryAvailableNow } from "@/lib/category-availability";
import { SimpleCache } from "@/lib/simple-cache";
import { numberFromDecimal } from "@/lib/db/decimal";

const publicMenuCache = new SimpleCache<PublicMenuCategory[]>(30_000);

async function fetchPublicCategories() {
  return prisma.category.findMany({
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
}

type PublicCategoryRecord = Awaited<ReturnType<typeof fetchPublicCategories>>[number];
type PublicMenuItemRecord = PublicCategoryRecord["menuItems"][number];

function serializePublicMenuItem(item: PublicMenuItemRecord): PublicMenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    price: numberFromDecimal(item.price) ?? 0,
    compareAtPrice: numberFromDecimal(item.compareAtPrice),
    availableWeekdays: item.availableWeekdays ?? [],
    optionGroups: item.optionGroups.map((link) => ({
      id: link.optionGroup.id,
      name: link.optionGroup.name,
      description: link.optionGroup.description,
      minSelections: link.optionGroup.minSelections,
      maxSelections: link.optionGroup.maxSelections,
      isRequired: link.optionGroup.isRequired,
      options: link.optionGroup.options.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        priceDelta: numberFromDecimal(option.priceDelta) ?? 0,
      })),
    })),
    ingredients: item.ingredients
      .filter((link) => link.ingredient?.isActive)
      .map((link) => ({
        id: link.ingredient.id,
        name: link.ingredient.name,
        quantity: link.quantity,
        price: numberFromDecimal(link.ingredient.price) ?? 0,
      })),
  };
}

function serializePublicCategory(category: PublicCategoryRecord): PublicMenuCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    availableFrom: category.availableFrom,
    availableUntil: category.availableUntil,
    menuItems: category.menuItems
      .filter((item) => isMenuItemAvailableNow(item as { availableWeekdays?: string[] | null }))
      .map(serializePublicMenuItem),
  };
}

export function invalidatePublicMenuCache(): void {
  publicMenuCache.invalidate("menu");
}

export async function getPublicMenu(): Promise<PublicMenuCategory[]> {
  const cached = publicMenuCache.get("menu");
  if (cached) return cached;

  const categories = await fetchPublicCategories();

  const result = categories
    .filter((category) => isCategoryAvailableNow(category as { availableFrom?: string | null; availableUntil?: string | null }))
    .map(serializePublicCategory)
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
