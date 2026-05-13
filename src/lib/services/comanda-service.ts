import { ApiError } from "@/lib/http";
import { buildOrderItemUnits } from "@/lib/order-item-units";
import { attachComandaOperationalSummary } from "@/lib/order-operations";
import { calculateLineItemPricing } from "@/lib/line-item-pricing";
import { prisma } from "@/lib/prisma";
import { syncMissingOrderItemUnits } from "@/lib/services/order-item-unit-service";
import { groupRepeatedIds } from "@/lib/option-item-quantity";
import { coerceNumber, decimal } from "@/lib/db/decimal";
import { optionalNullable, slugify } from "@/lib/utils";

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
      units: {
        orderBy: { sequence: "asc" as const },
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

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        code,
        channel: "local",
        type: "local",
        status: "novo",
        customerName: input.name.trim(),
        customerPhone: null,
        notes: optionalNullable(input.notes),
        subtotalAmount: decimal(0),
        deliveryFeeAmount: decimal(0),
        totalAmount: decimal(0),
        paymentMethod: null,
        paymentStatus: "pendente",
        statusEvents: {
          create: {
            toStatus: "novo",
            note: "Comanda criada no balcão.",
          },
        },
      },
    });

    return tx.comanda.create({
      data: {
        code,
        qrCodeSlug,
        orderId: order.id,
        name: input.name.trim(),
        notes: optionalNullable(input.notes),
        openedById: input.openedById,
        status: "novo",
        subtotalAmount: decimal(0),
        totalAmount: decimal(0),
      },
      include: comandaInclude,
    }).then((comanda) => attachComandaOperationalSummary(comanda));
  });
}

export async function getComandaBySlug(slug: string) {
  await syncMissingOrderItemUnits();

  return prisma.comanda.findUnique({
    where: { qrCodeSlug: slug },
    include: comandaInclude,
  }).then((comanda) => (comanda ? attachComandaOperationalSummary(comanda) : null));
}

export async function getComandaById(id: string) {
  await syncMissingOrderItemUnits();

  return prisma.comanda.findUnique({
    where: { id },
    include: comandaInclude,
  }).then((comanda) => (comanda ? attachComandaOperationalSummary(comanda) : null));
}

export async function listCommandas() {
  await syncMissingOrderItemUnits();

  return prisma.comanda.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: comandaInclude,
  }).then((commandas) => commandas.map((comanda) => attachComandaOperationalSummary(comanda)));
}

export async function addItemsToComanda(
  comandaId: string,
  items: ComandaItemInput[],
) {
  const comanda = await prisma.comanda.findUnique({
    where: { id: comandaId },
    include: {
      order: {
        include: {
          items: {
            include: {
              selectedOptions: true,
              ingredientCustomizations: true,
            },
          },
        },
      },
    },
  });

  if (!comanda) {
    throw new ApiError(404, "Comanda nao encontrada.");
  }

  if (comanda.status === "fechado" || comanda.status === "cancelado") {
    throw new ApiError(409, "Comanda nao aceita novos itens.");
  }

  const uniqueMenuItemIds = [...new Set(items.map((item) => item.menuItemId))];

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: uniqueMenuItemIds,
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

  if (menuItems.length !== uniqueMenuItemIds.length) {
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

    const selectedOptions = groupRepeatedIds(item.optionItemIds || []).map(({ id, quantity }) => {
      const option = optionMap.get(id);

      if (!option) {
        throw new ApiError(404, "Adicional nao encontrado.");
      }

      return { ...option, quantity };
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

    const { unitPrice, subtotalAmount } = calculateLineItemPricing({
      basePrice: menuItem.price,
      selectedOptions,
      quantity: item.quantity,
    });
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

  const newSubtotal = coerceNumber(comanda.subtotalAmount) + addedSubtotal;
  const newTotal = newSubtotal - coerceNumber(comanda.discountAmount);

  return prisma.$transaction(async (tx) => {
    const createdEntries = await Promise.all(
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
                quantity: option.quantity,
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

    if (comanda.orderId) {
      await Promise.all(
        normalizedItems.map(({ item, menuItem, selectedOptions, ingredientCustomizations, unitPrice, subtotalAmount }, index) =>
          tx.orderItem.create({
            data: {
              orderId: comanda.orderId as string,
              menuItemId: menuItem.id,
              quantity: item.quantity,
              unitPrice: decimal(unitPrice),
              subtotalAmount: decimal(subtotalAmount),
              notes: optionalNullable(item.notes),
              selectedOptions: {
                create: selectedOptions.map((option) => ({
                  optionItemId: option.id,
                  quantity: option.quantity,
                  unitPriceDelta: option.priceDelta,
                })),
              },
              ingredientCustomizations: {
                create: ingredientCustomizations.map((ing) => ({
                  ingredientId: ing.ingredientId,
                  quantity: ing.quantity,
                })),
              },
              units: {
                create: buildOrderItemUnits(item.quantity, createdEntries[index]?.id),
              },
            },
          }),
        ),
      );

      await tx.order.update({
        where: { id: comanda.orderId },
        data: {
          subtotalAmount: decimal(newSubtotal),
          totalAmount: decimal(newTotal),
        },
      });
    }

    return tx.comanda.update({
      where: { id: comandaId },
      data: {
        subtotalAmount: decimal(newSubtotal),
        totalAmount: decimal(newTotal),
      },
      include: comandaInclude,
    }).then((updatedComanda) => attachComandaOperationalSummary(updatedComanda));
  });
}

export async function closeComanda(
  comandaId: string,
  paymentMethod: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outro",
) {
  const comanda = await prisma.comanda.findUnique({
    where: { id: comandaId },
  });

  if (!comanda) {
    throw new ApiError(404, "Comanda nao encontrada.");
  }

  return prisma.$transaction(async (tx) => {
    if (comanda.orderId) {
      await tx.order.update({
        where: { id: comanda.orderId },
        data: {
          paymentMethod,
          paymentStatus: "pago",
        },
      });
    }

    return tx.comanda.update({
      where: { id: comandaId },
      data: {
        status: "fechado",
        paymentMethod,
        paymentStatus: "pago",
        closedAt: new Date(),
      },
      include: comandaInclude,
    }).then((updatedComanda) => attachComandaOperationalSummary(updatedComanda));
  });
}

export async function syncLegacyCommandasToOrders() {
  const legacyCommandas = await prisma.comanda.findMany({
    where: {
      orderId: null,
    },
    include: {
      entries: {
        include: {
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
    },
  });

  for (const comanda of legacyCommandas) {
    await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findFirst({
        where: {
          code: comanda.code,
        },
        select: { id: true },
      });

      if (existingOrder) {
        await tx.comanda.update({
          where: { id: comanda.id },
          data: { orderId: existingOrder.id },
        });
        return;
      }

      const order = await tx.order.create({
        data: {
          code: comanda.code,
          channel: "local",
          type: "local",
          status: comanda.status,
          customerName: comanda.name,
          customerPhone: null,
          notes: comanda.notes,
          subtotalAmount: comanda.subtotalAmount,
          deliveryFeeAmount: decimal(0),
          discountAmount: comanda.discountAmount,
          totalAmount: comanda.totalAmount,
          paymentMethod: comanda.paymentMethod,
          paymentStatus: comanda.paymentStatus,
        },
      });

      for (const entry of comanda.entries) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: entry.menuItemId,
            quantity: entry.quantity,
            unitPrice: entry.unitPrice,
            subtotalAmount: entry.subtotalAmount,
            notes: entry.notes,
            selectedOptions: {
              create: entry.selectedOptions.map((option) => ({
                optionItemId: option.optionItemId,
                quantity: option.quantity,
                unitPriceDelta: option.unitPriceDelta,
              })),
            },
            ingredientCustomizations: {
              create: entry.ingredientCustomizations.map((ing) => ({
                ingredientId: ing.ingredientId,
                quantity: ing.quantity,
              })),
            },
            units: {
              create: buildOrderItemUnits(entry.quantity, entry.id),
            },
          },
        });
      }

      await tx.comanda.update({
        where: { id: comanda.id },
        data: { orderId: order.id },
      });
    });
  }
}
