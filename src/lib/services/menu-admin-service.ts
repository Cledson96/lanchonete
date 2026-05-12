import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/http";
import { deleteManagedMenuItemImage, saveMenuItemImage } from "@/lib/menu-images";
import { normalizeMenuWeekdays } from "@/lib/menu-item-availability";
import { prisma } from "@/lib/prisma";
import { invalidatePublicMenuCache } from "@/lib/services/menu-service";
import { decimal, optionalNullable, slugify } from "@/lib/utils";

function hasOwn<T extends object>(value: T, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

async function getMenuItemImageTarget(itemId: string) {
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  if (!item) {
    throw new ApiError(404, "Item do cardapio nao encontrado.");
  }

  return item;
}

export async function uploadMenuItemImage(itemId: string, file: File) {
  const item = await getMenuItemImageTarget(itemId);
  const imageUrl = await saveMenuItemImage(file, item.name);

  await prisma.menuItem.update({
    where: { id: item.id },
    data: {
      imageUrl,
    },
  });

  await deleteManagedMenuItemImage(item.imageUrl);
  invalidatePublicMenuCache();

  return {
    id: item.id,
    imageUrl,
  };
}

export async function removeMenuItemImage(itemId: string) {
  const item = await getMenuItemImageTarget(itemId);

  await prisma.menuItem.update({
    where: { id: item.id },
    data: {
      imageUrl: null,
    },
  });

  await deleteManagedMenuItemImage(item.imageUrl);
  invalidatePublicMenuCache();

  return {
    id: item.id,
    imageUrl: null,
  };
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  sortOrder: number;
  availableFrom?: string;
  availableUntil?: string;
  isActive: boolean;
}) {
  return prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: optionalNullable(input.description),
      sortOrder: input.sortOrder,
      availableFrom: optionalNullable(input.availableFrom),
      availableUntil: optionalNullable(input.availableUntil),
      isActive: input.isActive,
    },
  });
}

export async function updateCategory(input: {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  availableFrom?: string;
  availableUntil?: string;
  isActive?: boolean;
}) {
  const data: Prisma.CategoryUpdateInput = {};

  if (hasOwn(input, "name")) {
    data.name = input.name;
  }

  if (hasOwn(input, "slug")) {
    data.slug = input.slug || slugify(input.name || "");
  }

  if (hasOwn(input, "description")) {
    data.description = optionalNullable(input.description);
  }

  if (hasOwn(input, "sortOrder")) {
    data.sortOrder = input.sortOrder;
  }

  if (hasOwn(input, "availableFrom")) {
    data.availableFrom = optionalNullable(input.availableFrom);
  }

  if (hasOwn(input, "availableUntil")) {
    data.availableUntil = optionalNullable(input.availableUntil);
  }

  if (hasOwn(input, "isActive")) {
    data.isActive = input.isActive;
  }

  return prisma.category.update({
    where: { id: input.id },
    data,
  });
}

export async function deleteCategory(input: {
  id: string;
  strategy: "delete_items" | "move_items";
  targetCategoryId?: string;
}) {
  const category = await prisma.category.findUnique({
    where: { id: input.id },
    include: {
      menuItems: {
        include: {
          orderItems: true,
          comandaEntries: true,
          usedInCombos: true,
        },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, "Categoria nao encontrada.");
  }

  if (input.strategy === "move_items") {
    if (!input.targetCategoryId) {
      throw new ApiError(422, "Selecione a categoria de destino.");
    }

    if (input.targetCategoryId === input.id) {
      throw new ApiError(422, "A categoria de destino precisa ser diferente.");
    }

    const targetCategory = await prisma.category.findUnique({
      where: { id: input.targetCategoryId },
      select: { id: true },
    });

    if (!targetCategory) {
      throw new ApiError(404, "Categoria de destino nao encontrada.");
    }

    await prisma.$transaction([
      prisma.menuItem.updateMany({
        where: { categoryId: input.id },
        data: { categoryId: input.targetCategoryId },
      }),
      prisma.category.delete({ where: { id: input.id } }),
    ]);

    return {
      category,
      movedItems: category.menuItems.length,
      deletedItems: 0,
    };
  }

  const blockedItems = category.menuItems.filter((item) => {
    return item.orderItems.length > 0 || item.comandaEntries.length > 0 || item.usedInCombos.length > 0;
  });

  if (blockedItems.length > 0) {
    throw new ApiError(409, "Alguns itens desta categoria ja possuem historico e nao podem ser excluidos.", {
      blockedItems: blockedItems.map((item) => ({
        id: item.id,
        name: item.name,
      })),
    });
  }

  await prisma.$transaction([
    prisma.menuItem.deleteMany({ where: { categoryId: input.id } }),
    prisma.category.delete({ where: { id: input.id } }),
  ]);

  return {
    category,
    movedItems: 0,
    deletedItems: category.menuItems.length,
  };
}

export async function createMenuItem(input: {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  kind: "simples" | "combo";
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  availableWeekdays?: string[];
  optionGroupIds: string[];
  ingredientIds?: string[];
  comboComponents: Array<{
    componentMenuItemId: string;
    quantity: number;
  }>;
}) {
  return prisma.menuItem.create({
    data: {
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: optionalNullable(input.description),
      imageUrl: optionalNullable(input.imageUrl),
      kind: input.kind,
      price: decimal(input.price),
      compareAtPrice:
        typeof input.compareAtPrice === "number"
          ? decimal(input.compareAtPrice)
          : null,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sortOrder: input.sortOrder,
      availableWeekdays: normalizeMenuWeekdays(input.availableWeekdays),
      optionGroups: {
        create: input.optionGroupIds.map((optionGroupId, index) => ({
          optionGroupId,
          sortOrder: index,
        })),
      },
      ingredients: {
        create: (input.ingredientIds || []).map((ingredientId, index) => ({
          ingredientId,
          quantity: 1,
          sortOrder: index,
        })),
      },
      comboItems:
        input.kind === "combo"
          ? {
              create: input.comboComponents.map((component, index) => ({
                componentMenuItemId: component.componentMenuItemId,
                quantity: component.quantity,
                sortOrder: index,
              })),
            }
          : undefined,
    },
    include: {
      category: true,
      optionGroups: {
        include: {
          optionGroup: true,
        },
      },
      ingredients: {
        include: {
          ingredient: true,
        },
      },
      comboItems: {
        orderBy: [{ sortOrder: "asc" }, { componentMenuItem: { name: "asc" } }],
        include: {
          componentMenuItem: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });
}

export async function updateMenuItem(input: {
  id: string;
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  kind?: "simples" | "combo";
  imageUrl?: string;
  price?: number;
  compareAtPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  availableWeekdays?: string[];
  optionGroupIds?: string[];
  ingredientIds?: string[];
  comboComponents?: Array<{
    componentMenuItemId: string;
    quantity: number;
  }>;
}) {
  const data: Prisma.MenuItemUpdateInput = {};

  if (hasOwn(input, "categoryId")) {
    data.category = { connect: { id: input.categoryId } };
  }

  if (hasOwn(input, "name")) {
    data.name = input.name;
  }

  if (hasOwn(input, "slug")) {
    data.slug = input.slug || slugify(input.name || "");
  }

  if (hasOwn(input, "description")) {
    data.description = optionalNullable(input.description);
  }

  if (hasOwn(input, "kind")) {
    data.kind = input.kind;
  }

  if (hasOwn(input, "imageUrl")) {
    data.imageUrl = optionalNullable(input.imageUrl);
  }

  if (hasOwn(input, "price") && typeof input.price === "number") {
    data.price = decimal(input.price);
  }

  if (hasOwn(input, "compareAtPrice")) {
    data.compareAtPrice =
      typeof input.compareAtPrice === "number"
        ? decimal(input.compareAtPrice)
        : null;
  }

  if (hasOwn(input, "isActive")) {
    data.isActive = input.isActive;
  }

  if (hasOwn(input, "isFeatured")) {
    data.isFeatured = input.isFeatured;
  }

  if (hasOwn(input, "sortOrder")) {
    data.sortOrder = input.sortOrder;
  }

  if (hasOwn(input, "availableWeekdays")) {
    data.availableWeekdays = normalizeMenuWeekdays(input.availableWeekdays);
  }

  if (hasOwn(input, "optionGroupIds")) {
    data.optionGroups = {
      deleteMany: {},
      create: (input.optionGroupIds || []).map((optionGroupId, index) => ({
        optionGroupId,
        sortOrder: index,
      })),
    };
  }

  if (hasOwn(input, "ingredientIds")) {
    data.ingredients = {
      deleteMany: {},
      create: (input.ingredientIds || []).map((ingredientId, index) => ({
        ingredientId,
        quantity: 1,
        sortOrder: index,
      })),
    };
  }

  if (hasOwn(input, "comboComponents") || input.kind === "simples") {
    data.comboItems = {
      deleteMany: {},
      create:
        input.kind === "combo"
          ? (input.comboComponents || []).map((component, index) => ({
              componentMenuItemId: component.componentMenuItemId,
              quantity: component.quantity,
              sortOrder: index,
            }))
          : [],
    };
  }

  return prisma.menuItem.update({
    where: { id: input.id },
    data,
    include: {
      category: true,
      optionGroups: {
        include: {
          optionGroup: true,
        },
      },
      ingredients: {
        include: {
          ingredient: true,
        },
      },
      comboItems: {
        orderBy: [{ sortOrder: "asc" }, { componentMenuItem: { name: "asc" } }],
        include: {
          componentMenuItem: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });
}

export async function createOptionGroup(input: {
  name: string;
  slug?: string;
  description?: string;
  minSelections: number;
  maxSelections?: number;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  options: Array<{
    name: string;
    slug?: string;
    description?: string;
    priceDelta: number;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
  }>;
}) {
  return prisma.optionGroup.create({
    data: {
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: optionalNullable(input.description),
      minSelections: input.minSelections,
      maxSelections: input.maxSelections ?? null,
      isRequired: input.isRequired,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      options: {
        create: input.options.map((option) => ({
          name: option.name,
          slug: option.slug || slugify(option.name),
          description: optionalNullable(option.description),
          priceDelta: decimal(option.priceDelta),
          isDefault: option.isDefault,
          isActive: option.isActive,
          sortOrder: option.sortOrder,
        })),
      },
    },
    include: {
      options: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function updateOptionGroup(input: {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  minSelections?: number;
  maxSelections?: number;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  options?: Array<{
    name: string;
    slug?: string;
    description?: string;
    priceDelta: number;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
  }>;
}) {
  const data: Prisma.OptionGroupUpdateInput = {};

  if (hasOwn(input, "name")) {
    data.name = input.name;
  }

  if (hasOwn(input, "slug")) {
    data.slug = input.slug || slugify(input.name || "");
  }

  if (hasOwn(input, "description")) {
    data.description = optionalNullable(input.description);
  }

  if (hasOwn(input, "minSelections")) {
    data.minSelections = input.minSelections;
  }

  if (hasOwn(input, "maxSelections")) {
    data.maxSelections = input.maxSelections ?? null;
  }

  if (hasOwn(input, "isRequired")) {
    data.isRequired = input.isRequired;
  }

  if (hasOwn(input, "sortOrder")) {
    data.sortOrder = input.sortOrder;
  }

  if (hasOwn(input, "isActive")) {
    data.isActive = input.isActive;
  }

  if (hasOwn(input, "options")) {
    data.options = {
      deleteMany: {},
      create: (input.options || []).map((option) => ({
        name: option.name,
        slug: option.slug || slugify(option.name),
        description: optionalNullable(option.description),
        priceDelta: decimal(option.priceDelta),
        isDefault: option.isDefault,
        isActive: option.isActive,
        sortOrder: option.sortOrder,
      })),
    };
  }

  return prisma.optionGroup.update({
    where: { id: input.id },
    data,
    include: {
      options: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function deleteOptionGroup(id: string) {
  const group = await prisma.optionGroup.findUnique({
    where: { id },
    include: { menuItems: true },
  });

  if (!group) {
    throw new Error("Grupo nao encontrado.");
  }

  await prisma.optionGroup.delete({ where: { id } });
  return group;
}

export async function createDeliveryFeeRule(input: {
  label: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCodeStart?: string;
  zipCodeEnd?: string;
  maxDistanceKm: number;
  feeAmount: number;
  minimumOrderAmount?: number;
  freeAboveAmount?: number;
  estimatedMinMinutes?: number;
  estimatedMaxMinutes?: number;
  sortOrder: number;
  isActive: boolean;
}) {
  return prisma.deliveryFeeRule.create({
    data: {
      label: input.label,
      neighborhood: optionalNullable(input.neighborhood),
      city: input.city,
      state: input.state,
      zipCodeStart: input.zipCodeStart || null,
      zipCodeEnd: input.zipCodeEnd || null,
      maxDistanceKm: decimal(input.maxDistanceKm),
      feeAmount: decimal(input.feeAmount),
      minimumOrderAmount:
        typeof input.minimumOrderAmount === "number"
          ? decimal(input.minimumOrderAmount)
          : null,
      freeAboveAmount:
        typeof input.freeAboveAmount === "number"
          ? decimal(input.freeAboveAmount)
          : null,
      estimatedMinMinutes: input.estimatedMinMinutes ?? null,
      estimatedMaxMinutes: input.estimatedMaxMinutes ?? null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
}

export async function updateDeliveryFeeRule(input: {
  id: string;
  label?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCodeStart?: string;
  zipCodeEnd?: string;
  maxDistanceKm?: number;
  feeAmount?: number;
  minimumOrderAmount?: number;
  freeAboveAmount?: number;
  estimatedMinMinutes?: number;
  estimatedMaxMinutes?: number;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const data: Prisma.DeliveryFeeRuleUpdateInput = {};

  if (hasOwn(input, "label")) {
    data.label = input.label;
  }

  if (hasOwn(input, "neighborhood")) {
    data.neighborhood = optionalNullable(input.neighborhood);
  }

  if (hasOwn(input, "city")) {
    data.city = input.city;
  }

  if (hasOwn(input, "state")) {
    data.state = input.state;
  }

  if (hasOwn(input, "zipCodeStart")) {
    data.zipCodeStart = input.zipCodeStart || null;
  }

  if (hasOwn(input, "zipCodeEnd")) {
    data.zipCodeEnd = input.zipCodeEnd || null;
  }

  if (hasOwn(input, "maxDistanceKm")) {
    data.maxDistanceKm =
      typeof input.maxDistanceKm === "number"
        ? decimal(input.maxDistanceKm)
        : null;
  }

  if (hasOwn(input, "feeAmount") && typeof input.feeAmount === "number") {
    data.feeAmount = decimal(input.feeAmount);
  }

  if (hasOwn(input, "minimumOrderAmount")) {
    data.minimumOrderAmount =
      typeof input.minimumOrderAmount === "number"
        ? decimal(input.minimumOrderAmount)
        : null;
  }

  if (hasOwn(input, "freeAboveAmount")) {
    data.freeAboveAmount =
      typeof input.freeAboveAmount === "number"
        ? decimal(input.freeAboveAmount)
        : null;
  }

  if (hasOwn(input, "estimatedMinMinutes")) {
    data.estimatedMinMinutes = input.estimatedMinMinutes ?? null;
  }

  if (hasOwn(input, "estimatedMaxMinutes")) {
    data.estimatedMaxMinutes = input.estimatedMaxMinutes ?? null;
  }

  if (hasOwn(input, "sortOrder")) {
    data.sortOrder = input.sortOrder;
  }

  if (hasOwn(input, "isActive")) {
    data.isActive = input.isActive;
  }

  return prisma.deliveryFeeRule.update({
    where: { id: input.id },
    data,
  });
}

export async function createIngredient(input: {
  name: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return prisma.ingredient.create({
    data: {
      name: input.name,
      slug: input.slug || slugify(input.name),
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateIngredient(input: {
  id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const data: Prisma.IngredientUpdateInput = {};

  if (hasOwn(input, "name")) {
    data.name = input.name;
  }

  if (hasOwn(input, "slug")) {
    data.slug = input.slug || slugify(input.name || "");
  }

  if (hasOwn(input, "isActive")) {
    data.isActive = input.isActive;
  }

  if (hasOwn(input, "sortOrder")) {
    data.sortOrder = input.sortOrder;
  }

  return prisma.ingredient.update({
    where: { id: input.id },
    data,
  });
}

export async function deleteIngredient(id: string) {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: { menuItems: true },
  });

  if (!ingredient) {
    throw new Error("Ingrediente nao encontrado.");
  }

  await prisma.ingredient.delete({ where: { id } });
  return ingredient;
}
