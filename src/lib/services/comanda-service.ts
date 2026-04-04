import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { decimal, optionalNullable } from "@/lib/utils";

type ComandaItemInput = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  optionItemIds?: string[];
};

export async function getComandaBySlug(slug: string) {
  return prisma.comanda.findUnique({
    where: { qrCodeSlug: slug },
    include: {
      customerProfile: true,
      entries: {
        orderBy: { createdAt: "asc" },
        include: {
          menuItem: true,
          selectedOptions: {
            include: {
              optionItem: true,
            },
          },
        },
      },
    },
  });
}

export async function getComandaById(id: string) {
  return prisma.comanda.findUnique({
    where: { id },
    include: {
      customerProfile: true,
      entries: {
        orderBy: { createdAt: "asc" },
        include: {
          menuItem: true,
          selectedOptions: {
            include: {
              optionItem: true,
            },
          },
        },
      },
    },
  });
}

export async function listCommandas() {
  return prisma.comanda.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      customerProfile: true,
      entries: {
        orderBy: { createdAt: "asc" },
        include: {
          menuItem: true,
        },
      },
    },
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
      unitPrice,
      subtotalAmount,
    };
  });

  const newSubtotal = Number(comanda.subtotalAmount) + addedSubtotal;
  const newTotal = newSubtotal - Number(comanda.discountAmount);

  return prisma.$transaction(async (tx) => {
    await Promise.all(
      normalizedItems.map(({ item, menuItem, selectedOptions, unitPrice, subtotalAmount }) =>
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
      include: {
        customerProfile: true,
        entries: {
          orderBy: { createdAt: "asc" },
          include: {
            menuItem: true,
            selectedOptions: {
              include: {
                optionItem: true,
              },
            },
          },
        },
      },
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
    include: {
      customerProfile: true,
      entries: {
        include: {
          menuItem: true,
        },
      },
    },
  });
}
