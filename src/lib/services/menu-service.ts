import { prisma } from "@/lib/prisma";

export async function getPublicMenu() {
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

  return categories.map((category) => ({
    ...category,
    menuItems: category.menuItems.map((item) => ({
      ...item,
      optionGroups: item.optionGroups.map((link) => link.optionGroup),
      ingredients: item.ingredients
        .filter((link) => link.ingredient?.isActive)
        .map((link) => ({
          id: link.ingredient.id,
          name: link.ingredient.name,
          quantity: link.quantity,
        })),
    })),
  }));
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
