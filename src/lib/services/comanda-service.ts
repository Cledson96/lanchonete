import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { decimal, optionalNullable, slugify } from "@/lib/utils";

type ComandaItemInput = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  optionItemIds?: string[];
  ingredients?: Array<{ ingredientId: string; quantity: number }>;
};

const comandaInclude = {
  customerProfile: true,
  openedBy: {
    select: {
      id: true,
      email: true,
    },
  },
  entries: {
    orderBy: { createdAt: "asc" as const },
    include: {
      menuItem: true,
      selectedOptions: {
        include: {
          optionItem: true,
        },
      },
      ingredientCustomizations: {
        include: {
          ingredient: true,
        },
      },
    },
  },
};

async function generateUniqueComandaCode() {
  while (true) {
    const code = `CM-${Math.random().toString(36).slice(2, 5).toUpperCase()}${Date.now()
      .toString(36)
      .slice(-4)
      .toUpperCase()}`;

    const existing = await prisma.comanda.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }
}

async function generateUniqueQrSlug(name: string) {
  const base = slugify(name) || "comanda";

  while (true) {
    const suffix = Math.random().toString(36).slice(2, 7);
    const qrCodeSlug = `${base}-${suffix}`;
    const existing = await prisma.comanda.findUnique({
      where: { qrCodeSlug },
      select: { id: true },
    });

    if (!existing) {
      return qrCodeSlug;
    }
  }
}

export async function createComanda(input: {
  name: string;
  notes?: string;
  openedById?: string;
}) {
  const code = await generateUniqueComandaCode();
  const qrCodeSlug = await generateUniqueQrSlug(input.name);

  return prisma.comanda.create({
    data: {
      code,
      qrCodeSlug,
      name: input.name.trim(),
      notes: optionalNullable(input.notes),
      openedById: input.openedById,
      status: "novo",
      subtotalAmount: decimal(0),
      totalAmount: decimal(0),
    },
    include: comandaInclude,
  });
}

export async function getComandaBySlug(slug: string) {
  return prisma.comanda.findUnique({
    where: { qrCodeSlug: slug },
    include: comandaInclude,
  });
}

export async function getComandaById(id: string) {
  return prisma.comanda.findUnique({
    where: { id },
    include: comandaInclude,
  });
}

export async function listCommandas() {
  return prisma.comanda.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: comandaInclude,
  });
}

export async function addItemsToComanda(
  comandaId: string,
  items: ComandaItemInput[],
) {
  const comanda = await prisma.comanda.findUnique({
    where: { id: comandaId },
  });

  if (!comanda) {
    throw new ApiError(404, "Comanda nao encontrada.");
  }

  if (comanda.status === "fechado" || comanda.status === "cancelado") {
    throw new ApiError(409, "Comanda nao aceita novos itens.");
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: items.map((item) => item.menuItemId),
      },
      isActive: true,
    },
    include: {
      optionGroups: {
        include: {
          optionGroup: {
            include: {
              options: {
                where: { isActive: true },
                select: { id: true },
              },
            },
          },
        },
      },
      ingredients: {
        where: { ingredient: { isActive: true } },
        include: { ingredient: { select: { id: true } } },
      },
    },
  });

  if (menuItems.length !== items.length) {
    throw new ApiError(404, "Um ou mais itens da comanda nao existem.");
  }

  const optionIds = items.flatMap((item) => item.optionItemIds || []);
  const optionItems = optionIds.length
    ? await prisma.optionItem.findMany({
        where: {
          id: {
            in: optionIds,
          },
          isActive: true,
        },
      })
    : [];

  const ingredientIds = items.flatMap((item) => (item.ingredients || []).map((ing) => ing.ingredientId));
  const ingredientRecords = ingredientIds.length
    ? await prisma.ingredient.findMany({
        where: {
          id: { in: ingredientIds },
          isActive: true,
        },
      })
    : [];

  const ingredientSet = new Set(ingredientRecords.map((i) => i.id));

  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const optionMap = new Map(optionItems.map((item) => [item.id, item]));

  let addedSubtotal = 0;
  const normalizedItems = items.map((item) => {
    const menuItem = menuMap.get(item.menuItemId);

    if (!menuItem) {
      throw new ApiError(404, "Item do cardapio nao encontrado.");
    }

    const selectedOptions = (item.optionItemIds || []).map((optionId) => {
      const option = optionMap.get(optionId);

      if (!option) {
        throw new ApiError(404, "Adicional nao encontrado.");
      }

      return option;
    });

    const validOptionIds = new Set(
      menuItem.optionGroups.flatMap((link) =>
        link.optionGroup.options.map((o) => o.id),
      ),
    );

    for (const option of selectedOptions) {
      if (!validOptionIds.has(option.id)) {
        throw new ApiError(422, `O adicional "${option.name}" nao pertence a este item.`);
      }
    }

    const validIngredientIds = new Set(
      menuItem.ingredients.map((link) => link.ingredientId),
    );

    for (const ing of item.ingredients || []) {
      if (!validIngredientIds.has(ing.ingredientId)) {
        throw new ApiError(422, `O ingrediente nao pertence a este item.`);
      }
      if (!ingredientSet.has(ing.ingredientId)) {
        throw new ApiError(404, `Ingrediente nao encontrado.`);
      }
      if (ing.quantity < 0 || ing.quantity > 10) {
        throw new ApiError(422, `Quantidade de ingrediente invalida.`);
      }
    }

    const ingredientCustomizations = (item.ingredients || []).map((ing) => ({
      ...ing,
    }));

    const optionDelta = selectedOptions.reduce(
      (sum, option) => sum + Number(option.priceDelta),
      0,
    );
    const unitPrice = Number(menuItem.price) + optionDelta;
    const subtotalAmount = unitPrice * item.quantity;
    addedSubtotal += subtotalAmount;

    return {
      item,
      menuItem,
      selectedOptions,
      ingredientCustomizations,
      unitPrice,
      subtotalAmount,
    };
  });

  const newSubtotal = Number(comanda.subtotalAmount) + addedSubtotal;
  const newTotal = newSubtotal - Number(comanda.discountAmount);

  return prisma.$transaction(async (tx) => {
    await Promise.all(
      normalizedItems.map(({ item, menuItem, selectedOptions, ingredientCustomizations, unitPrice, subtotalAmount }) =>
        tx.comandaEntry.create({
          data: {
            comandaId,
            menuItemId: menuItem.id,
            quantity: item.quantity,
            unitPrice: decimal(unitPrice),
            subtotalAmount: decimal(subtotalAmount),
            notes: optionalNullable(item.notes),
            sentToKitchenAt: new Date(),
            selectedOptions: {
              create: selectedOptions.map((option) => ({
                optionItemId: option.id,
                quantity: 1,
                unitPriceDelta: option.priceDelta,
              })),
            },
            ingredientCustomizations: {
              create: ingredientCustomizations.map((ing) => ({
                ingredientId: ing.ingredientId,
                quantity: ing.quantity,
              })),
            },
          },
        }),
      ),
    );

    return tx.comanda.update({
      where: { id: comandaId },
      data: {
        subtotalAmount: decimal(newSubtotal),
        totalAmount: decimal(newTotal),
      },
      include: comandaInclude,
    });
  });
}

export async function closeComanda(
  comandaId: string,
  paymentMethod: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outro",
) {
  return prisma.comanda.update({
    where: { id: comandaId },
    data: {
      status: "fechado",
      paymentMethod,
      paymentStatus: "pago",
      closedAt: new Date(),
    },
    include: comandaInclude,
  });
}
