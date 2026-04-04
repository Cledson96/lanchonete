import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { resolveDeliveryFeeRule } from "@/lib/services/delivery-fee-service";
import { decimal, normalizePhone, optionalNullable } from "@/lib/utils";

type CreateOrderItemInput = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  optionItemIds?: string[];
};

type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
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

  if (input.type === "delivery" && !input.address) {
    throw new ApiError(422, "Endereco obrigatorio para entrega.");
  }

  const customerPhone = normalizePhone(input.customerPhone);

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: input.items.map((item) => item.menuItemId),
      },
      isActive: true,
    },
  });

  if (menuItems.length !== input.items.length) {
    throw new ApiError(404, "Um ou mais itens do pedido nao existem.");
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

  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const optionMap = new Map(optionItems.map((item) => [item.id, item]));

  let subtotal = 0;
  const normalizedItems = input.items.map((item) => {
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
    const lineSubtotal = unitPrice * item.quantity;
    subtotal += lineSubtotal;

    return {
      item,
      menuItem,
      selectedOptions,
      unitPrice,
      lineSubtotal,
    };
  });

  let deliveryFeeRuleId: string | null = null;
  let deliveryFeeAmount = 0;

  if (input.type === "delivery" && input.address) {
    const deliveryQuote = await resolveDeliveryFeeRule({
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

    const order = await tx.order.create({
      data: {
        customerProfileId: input.customerProfileId,
        addressId: address?.id,
        deliveryFeeRuleId,
        code: generateOrderCode(),
        channel: "web",
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
          create: normalizedItems.map(({ item, menuItem, selectedOptions, unitPrice, lineSubtotal }) => ({
            menuItemId: menuItem.id,
            quantity: item.quantity,
            unitPrice: money(unitPrice),
            subtotalAmount: money(lineSubtotal),
            notes: optionalNullable(item.notes),
            selectedOptions: {
              create: selectedOptions.map((option) => ({
                optionItemId: option.id,
                quantity: 1,
                unitPriceDelta: option.priceDelta,
              })),
            },
          })),
        },
        statusEvents: {
          create: {
            toStatus: "novo",
            note: "Pedido criado via web.",
          },
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
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
