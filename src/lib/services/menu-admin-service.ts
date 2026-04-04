import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimal, optionalNullable, slugify } from "@/lib/utils";

function hasOwn<T extends object>(value: T, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}) {
  return prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: optionalNullable(input.description),
      sortOrder: input.sortOrder,
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

  if (hasOwn(input, "isActive")) {
    data.isActive = input.isActive;
  }

  return prisma.category.update({
    where: { id: input.id },
    data,
  });
}

export async function createMenuItem(input: {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  optionGroupIds: string[];
}) {
  return prisma.menuItem.create({
    data: {
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: optionalNullable(input.description),
      imageUrl: optionalNullable(input.imageUrl),
      price: decimal(input.price),
      compareAtPrice:
        typeof input.compareAtPrice === "number"
          ? decimal(input.compareAtPrice)
          : null,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sortOrder: input.sortOrder,
      optionGroups: {
        create: input.optionGroupIds.map((optionGroupId, index) => ({
          optionGroupId,
          sortOrder: index,
        })),
      },
    },
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

export async function updateMenuItem(input: {
  id: string;
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  compareAtPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  optionGroupIds?: string[];
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

  if (hasOwn(input, "optionGroupIds")) {
    data.optionGroups = {
      deleteMany: {},
      create: (input.optionGroupIds || []).map((optionGroupId, index) => ({
        optionGroupId,
        sortOrder: index,
      })),
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

export async function createDeliveryFeeRule(input: {
  label: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCodeStart?: string;
  zipCodeEnd?: string;
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
