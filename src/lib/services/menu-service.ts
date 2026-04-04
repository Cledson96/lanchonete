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
        },
      },
    },
  });

  return categories.map((category) => ({
    ...category,
    menuItems: category.menuItems.map((item) => ({
      ...item,
      optionGroups: item.optionGroups.map((link) => link.optionGroup),
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
      optionGroups: {
        include: {
          optionGroup: true,
        },
      },
    },
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
