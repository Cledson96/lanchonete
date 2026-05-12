import { ApiError } from "@/lib/http";
import { formatAvailabilityWindow, isCategoryAvailableNow } from "@/lib/category-availability";
import { calculateLineItemPricing } from "@/lib/line-item-pricing";
import { formatMenuWeekdays, isMenuItemAvailableNow } from "@/lib/menu-item-availability";
import { buildOrderItemUnits } from "@/lib/order-item-units";
import { groupRepeatedIds } from "@/lib/option-item-quantity";
import { prisma } from "@/lib/prisma";
import { resolveDeliveryFeeRule } from "@/lib/services/delivery-fee-service";
import { assertStoreIsOpenForOrders } from "@/lib/services/store-settings-service";
import { decimal, normalizePhone, optionalNullable } from "@/lib/utils";

type CreateOrderItemInput = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  optionItemIds?: string[];
  ingredients?: Array<{ ingredientId: string; quantity: number }>;
};

type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  channel?: "web" | "whatsapp" | "local";
  type: "delivery" | "retirada" | "local";
  paymentMethod: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outro";
  notes?: string;
  items: CreateOrderItemInput[];
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string;
    reference?: string;
  };
  customerProfileId?: string;
};

function money(value: number) {
  return decimal(value);
}

function generateOrderCode() {
  return `PD-${Date.now().toString(36).toUpperCase()}`;
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.items.length) {
    throw new ApiError(422, "Pedido sem itens.");
  }

  if (input.channel !== "local") {
    await assertStoreIsOpenForOrders();
  }

  if (input.type === "delivery" && !input.address) {
    throw new ApiError(422, "Endereco obrigatorio para entrega.");
  }

  const customerPhone = normalizePhone(input.customerPhone);
  const uniqueMenuItemIds = [...new Set(input.items.map((item) => item.menuItemId))];

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
        include: { ingredient: { select: { id: true, name: true } } },
      },
    },
  });

  const categoryIds = [...new Set(menuItems.map((item) => item.categoryId))];
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      })
    : [];
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  type MenuItemForValidation = typeof menuItems[number];
  const typedMenuItems: MenuItemForValidation[] = menuItems;

  if (menuItems.length !== uniqueMenuItemIds.length) {
    throw new ApiError(404, "Um ou mais itens do pedido nao existem.");
  }

  const unavailableCategory = typedMenuItems.find((item) => {
    const category = categoryMap.get(item.categoryId) as
      | { availableFrom?: string | null; availableUntil?: string | null }
      | undefined;

    return !isCategoryAvailableNow(category || {});
  });

  if (unavailableCategory) {
    const category = categoryMap.get(unavailableCategory.categoryId);

    if (!category) {
      throw new ApiError(404, "Categoria do cardapio nao encontrada.");
    }

    throw new ApiError(
      422,
      `O cardapio ${category.name} esta disponivel apenas ${formatAvailabilityWindow(category as { availableFrom?: string | null; availableUntil?: string | null })}.`,
    );
  }

  const unavailableMenuItem = typedMenuItems.find((item) => !isMenuItemAvailableNow(item));

  if (unavailableMenuItem) {
    throw new ApiError(
      422,
      `O item "${unavailableMenuItem.name}" esta disponivel apenas em ${formatMenuWeekdays(unavailableMenuItem.availableWeekdays as string[] | null)}.`,
    );
  }

  const optionIds = input.items.flatMap((item) => item.optionItemIds || []);
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

  const ingredientIds = input.items.flatMap((item) => (item.ingredients || []).map((ing) => ing.ingredientId));
  const ingredientRecords = ingredientIds.length
    ? await prisma.ingredient.findMany({
        where: {
          id: { in: ingredientIds },
          isActive: true,
        },
      })
    : [];
  const ingredientSet = new Set(ingredientRecords.map((i) => i.id));

  const menuMap = new Map(typedMenuItems.map((item) => [item.id, item]));
  const optionMap = new Map(optionItems.map((item) => [item.id, item]));

  let subtotal = 0;
  const normalizedItems = input.items.map((item) => {
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
      ingredientName: ingredientRecords.find((r) => r.id === ing.ingredientId)?.name,
    }));

    const { unitPrice, subtotalAmount: lineSubtotal } = calculateLineItemPricing({
      basePrice: menuItem.price,
      selectedOptions,
      quantity: item.quantity,
    });
    subtotal += lineSubtotal;

    return {
      item,
      menuItem,
      selectedOptions,
      ingredientCustomizations,
      unitPrice,
      lineSubtotal,
    };
  });

  let deliveryFeeRuleId: string | null = null;
  let deliveryFeeAmount = 0;

  if (input.type === "delivery" && input.address) {
    const deliveryQuote = await resolveDeliveryFeeRule({
      street: input.address.street,
      number: input.address.number,
      zipCode: input.address.zipCode,
      neighborhood: input.address.neighborhood,
      city: input.address.city,
      state: input.address.state,
      subtotalAmount: subtotal,
    });

    deliveryFeeRuleId = deliveryQuote.deliveryFeeRuleId;
    deliveryFeeAmount = deliveryQuote.feeAmount;
  }

  const totalAmount = subtotal + deliveryFeeAmount;

  return prisma.$transaction(async (tx) => {
    if (input.customerProfileId) {
      await tx.customerProfile.update({
        where: { id: input.customerProfileId },
        data: {
          fullName: input.customerName,
        },
      });
    }

    const address =
      input.type === "delivery" && input.address
        ? await tx.address.create({
            data: {
              customerProfileId: input.customerProfileId,
              recipientName: input.customerName,
              phone: customerPhone,
              zipCode: input.address.zipCode,
              street: input.address.street,
              number: input.address.number,
              complement: input.address.complement,
              neighborhood: input.address.neighborhood,
              city: input.address.city,
              state: input.address.state,
              reference: input.address.reference,
            },
          })
        : null;

    if (input.customerProfileId && address) {
      await tx.address.updateMany({
        where: {
          customerProfileId: input.customerProfileId,
          NOT: { id: address.id },
        },
        data: {
          isDefault: false,
        },
      });

      await tx.address.update({
        where: { id: address.id },
        data: {
          isDefault: true,
        },
      });

      await tx.customerProfile.update({
        where: { id: input.customerProfileId },
        data: {
          defaultAddressId: address.id,
        },
      });
    }

    const order = await tx.order.create({
      data: {
        customerProfileId: input.customerProfileId,
        addressId: address?.id,
        deliveryFeeRuleId,
        code: generateOrderCode(),
        channel: input.channel || "web",
        type: input.type,
        status: "novo",
        customerName: input.customerName,
        customerPhone,
        paymentMethod: input.paymentMethod,
        paymentStatus: "pendente",
        notes: optionalNullable(input.notes),
        subtotalAmount: money(subtotal),
        deliveryFeeAmount: money(deliveryFeeAmount),
        totalAmount: money(totalAmount),
        items: {
          create: normalizedItems.map(({ item, menuItem, selectedOptions, ingredientCustomizations, unitPrice, lineSubtotal }) => ({
            menuItemId: menuItem.id,
            quantity: item.quantity,
            unitPrice: money(unitPrice),
            subtotalAmount: money(lineSubtotal),
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
              create: buildOrderItemUnits(item.quantity),
            },
          })),
        },
        statusEvents: {
          create: {
            toStatus: "novo",
            note:
              input.channel === "whatsapp"
                ? "Pedido criado via WhatsApp."
                : "Pedido criado via web.",
          },
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                ingredients: {
                  include: {
                    ingredient: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            ingredientCustomizations: {
              include: {
                ingredient: true,
              },
            },
            units: {
              orderBy: { sequence: "asc" },
            },
            selectedOptions: {
              include: {
                optionItem: true,
              },
            },
          },
        },
        deliveryAddress: true,
      },
    });

    return order;
  });
}

export async function getOrderByCode(code: string) {
  return prisma.order.findUnique({
    where: { code },
    include: {
      deliveryAddress: true,
      deliveryFeeRule: true,
      items: {
        include: {
          menuItem: true,
          ingredientCustomizations: {
            include: {
              ingredient: true,
            },
          },
          units: {
            orderBy: { sequence: "asc" },
          },
          selectedOptions: {
            include: {
              optionItem: true,
            },
          },
        },
      },
      statusEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
