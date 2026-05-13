import { Prisma, OrderItemUnitStatus, OrderStatus } from "@prisma/client";
import { ApiError } from "@/lib/api/error";
import {
  ORDER_ITEM_UNIT_TRANSITIONS,
  attachOrderOperationalSummary,
  buildUnitTimestampPatch,
} from "@/lib/order-operations";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp";
import { syncLegacyCommandasToOrders } from "@/lib/services/comanda-service";
import { syncMissingOrderItemUnits } from "@/lib/services/order-item-unit-service";
import { normalizePhone } from "@/lib/utils";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  novo: ["em_preparo", "cancelado"],
  em_preparo: ["pronto", "cancelado"],
  pronto: ["saiu_para_entrega", "fechado"],
  saiu_para_entrega: ["entregue", "cancelado"],
  entregue: ["fechado"],
  fechado: [],
  cancelado: [],
};

const dashboardOrderViewStatuses = {
  operation: ["novo", "em_preparo", "pronto", "saiu_para_entrega"],
  kitchen: ["novo", "em_preparo"],
  dispatch: ["pronto", "saiu_para_entrega"],
  archive: ["entregue", "fechado", "cancelado"],
} satisfies Record<string, OrderStatus[]>;

const orderInclude = {
  customerProfile: true,
  comanda: {
    select: {
      id: true,
      code: true,
      name: true,
      notes: true,
      totalAmount: true,
      entries: {
        select: {
          id: true,
        },
      },
    },
  },
  acceptedBy: true,
  items: {
    include: {
      menuItem: true,
      units: {
        orderBy: { sequence: "asc" as const },
      },
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
  statusEvents: {
    orderBy: { createdAt: "asc" as const },
  },
} as const;

const readyStatusTransitions = new Set<OrderStatus>(["novo", "em_preparo"]);

async function loadOrderOperationalState(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          units: {
            orderBy: { sequence: "asc" as const },
          },
        },
      },
      comanda: {
        select: {
          id: true,
        },
      },
    },
  });

  return order ? attachOrderOperationalSummary(order) : null;
}

async function syncLinkedComandaStatus(tx: Prisma.TransactionClient, orderId: string, status: OrderStatus) {
  if (status !== "pronto") {
    return;
  }

  await tx.comanda.updateMany({
    where: { orderId },
    data: { status: "pronto" },
  });
}

async function promoteOrderWhenAllUnitsReady(tx: Prisma.TransactionClient, orderId: string, now: Date) {
  const order = await loadOrderOperationalState(tx, orderId);

  if (!order || !order.operationalSummary.isFullyReady) {
    return null;
  }

  if (readyStatusTransitions.has(order.status)) {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "pronto",
        acceptedAt: order.status === "novo" && !order.acceptedAt ? now : order.acceptedAt,
        preparedAt: now,
        statusEvents: {
          create: {
            fromStatus: order.status,
            toStatus: "pronto",
            note: "Todos os itens ficaram prontos.",
          },
        },
      },
      include: {
        customerProfile: true,
        items: {
          include: {
            menuItem: true,
            units: {
              orderBy: { sequence: "asc" },
            },
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
        statusEvents: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await syncLinkedComandaStatus(tx, orderId, "pronto");

    return attachOrderOperationalSummary(updated as typeof updated & { comanda?: null });
  }

  return null;
}

function syncUnitStatusesForOrderTransition(tx: Prisma.TransactionClient, orderId: string, toStatus: OrderStatus, now: Date) {
  if (toStatus === "em_preparo") {
    return tx.orderItemUnit.updateMany({
      where: {
        orderItem: { orderId },
        status: "novo",
      },
      data: {
        status: "em_preparo",
        ...buildUnitTimestampPatch("em_preparo", now),
      },
    });
  }

  if (toStatus === "pronto") {
    return tx.orderItemUnit.updateMany({
      where: {
        orderItem: { orderId },
        status: { in: ["novo", "em_preparo"] },
      },
      data: {
        status: "pronto",
        startedAt: now,
        readyAt: now,
      },
    });
  }

  if (toStatus === "entregue") {
    return tx.orderItemUnit.updateMany({
      where: {
        orderItem: { orderId },
        status: "pronto",
      },
      data: {
        status: "entregue",
        deliveredAt: now,
      },
    });
  }

  if (toStatus === "cancelado") {
    return tx.orderItemUnit.updateMany({
      where: {
        orderItem: { orderId },
        status: { in: ["novo", "em_preparo", "pronto"] },
      },
      data: {
        status: "cancelado",
        cancelledAt: now,
      },
    });
  }

  return Promise.resolve({ count: 0 });
}

export type DashboardOrderView = keyof typeof dashboardOrderViewStatuses;

function getStatusMessage(code: string, status: OrderStatus, type: "delivery" | "retirada" | "local") {
  if (status === "saiu_para_entrega" && type === "delivery") {
    return `Pedido ${code} saiu para entrega. Ja esta a caminho.`;
  }

  return null;
}

async function recordOutboundOrderMessage(order: {
  id: string;
  customerProfileId: string | null;
  customerName: string | null;
  customerPhone: string | null;
}, content: string, externalMessageId?: string) {
  if (!order.customerPhone) {
    return;
  }

  const phone = normalizePhone(order.customerPhone);
  const customer =
    order.customerProfileId
      ? await prisma.customerProfile.findUnique({
          where: { id: order.customerProfileId },
        })
      : await prisma.customerProfile.upsert({
          where: { phone },
          create: {
            phone,
            fullName: order.customerName || "Cliente",
          },
          update: {
            fullName: order.customerName || undefined,
          },
        });

  if (!customer) {
    return;
  }

  const conversation =
    (await prisma.whatsAppConversation.findFirst({
      where: {
        customerProfileId: customer.id,
      },
      orderBy: { updatedAt: "desc" },
    })) ||
    (await prisma.whatsAppConversation.create({
      data: {
        customerProfileId: customer.id,
        orderId: order.id,
        phone,
        state: "order_updates",
        lastMessageAt: new Date(),
      },
    }));

  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      externalMessageId: externalMessageId || undefined,
      direction: "outbound",
      status: externalMessageId ? "sent" : "pending",
      content,
      sentAt: new Date(),
    },
  });
}

export async function listOrders(filters?: {
  status?: OrderStatus;
  channel?: "web" | "whatsapp" | "local";
  type?: "delivery" | "retirada" | "local";
  view?: DashboardOrderView;
}) {
  await syncLegacyCommandasToOrders();
  await syncMissingOrderItemUnits();

  const statusFilter =
    filters?.status ??
    (filters?.view ? { in: dashboardOrderViewStatuses[filters.view] } : undefined);

  return prisma.order.findMany({
    where: {
      status: statusFilter,
      channel: filters?.channel,
      type: filters?.type,
    },
    orderBy:
      filters?.view === "archive"
        ? [{ updatedAt: "desc" }]
        : [{ createdAt: "asc" }],
    include: orderInclude,
  }).then((orders) => orders.map((order) => attachOrderOperationalSummary(order)));
}

export async function getOrderById(id: string) {
  await syncMissingOrderItemUnits();

  return prisma.order.findUnique({
    where: { id },
    include: {
      ...orderInclude,
      deliveryAddress: true,
      deliveryFeeRule: true,
      statusEvents: {
        orderBy: { createdAt: "asc" },
        include: {
          changedBy: true,
        },
      },
    },
  }).then((order) => (order ? attachOrderOperationalSummary(order) : null));
}

export async function transitionOrderItemUnitStatus(input: {
  orderId: string;
  orderItemId: string;
  unitId: string;
  toStatus: OrderItemUnitStatus;
}) {
  const unit = await prisma.orderItemUnit.findUnique({
    where: { id: input.unitId },
    include: {
      orderItem: {
        select: {
          id: true,
          orderId: true,
          order: {
            select: {
              type: true,
            },
          },
        },
      },
    },
  });

  if (!unit || unit.orderItemId !== input.orderItemId || unit.orderItem.orderId !== input.orderId) {
    throw new ApiError(404, "Unidade do item nao encontrada.");
  }

  if (unit.status === input.toStatus) {
    throw new ApiError(409, "A unidade ja esta neste status.");
  }

  if (!ORDER_ITEM_UNIT_TRANSITIONS[unit.status].includes(input.toStatus)) {
    throw new ApiError(409, "Transicao de status da unidade invalida.");
  }

  if (input.toStatus === "entregue" && unit.orderItem.order.type !== "local") {
    throw new ApiError(422, "Entrega por unidade so esta disponivel para consumo local.");
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.orderItemUnit.update({
      where: { id: unit.id },
      data: {
        status: input.toStatus,
        ...buildUnitTimestampPatch(input.toStatus, now),
      },
    });

    const promoted = await promoteOrderWhenAllUnitsReady(tx, input.orderId, now);
    if (promoted) {
      return promoted;
    }

    const order = await loadOrderOperationalState(tx, input.orderId);

    if (!order) {
      throw new ApiError(404, "Pedido nao encontrado.");
    }

    return order;
  });
}

export async function getDashboardMetrics() {
  await syncLegacyCommandasToOrders();
  await syncMissingOrderItemUnits();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const completedStatuses: OrderStatus[] = ["entregue", "fechado"];

  const [
    newOrders,
    preparingOrders,
    dispatchingOrders,
    localOrders,
    legacyCommandas,
    completedToday,
    cancelledToday,
    revenueToday,
    channelBreakdown,
    typeBreakdown,
  ] = await Promise.all([
    prisma.order.count({ where: { status: "novo" } }),
    prisma.order.count({ where: { status: "em_preparo" } }),
    prisma.order.count({ where: { status: "saiu_para_entrega" } }),
    prisma.order.count({
      where: {
        channel: "local",
        type: "local",
        status: { notIn: ["fechado", "cancelado"] },
      },
    }),
    prisma.comanda.count({
      where: {
        orderId: null,
        status: { notIn: ["fechado", "cancelado"] },
      },
    }),
    prisma.order.count({
      where: {
        status: { in: completedStatuses },
        OR: [
          { deliveredAt: { gte: startOfDay } },
          { updatedAt: { gte: startOfDay } },
        ],
      },
    }),
    prisma.order.count({
      where: {
        status: "cancelado",
        cancelledAt: { gte: startOfDay },
      },
    }),
    prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: { in: completedStatuses },
        OR: [
          { deliveredAt: { gte: startOfDay } },
          { updatedAt: { gte: startOfDay } },
        ],
      },
    }),
    prisma.order.groupBy({
      by: ["channel"],
      where: {
        createdAt: { gte: startOfDay },
      },
      _count: {
        _all: true,
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.order.groupBy({
      by: ["type"],
      where: {
        createdAt: { gte: startOfDay },
      },
      _count: {
        _all: true,
      },
      _sum: {
        totalAmount: true,
      },
    }),
  ]);

  return {
    newOrders,
    preparingOrders,
    dispatchingOrders,
    openCommandas: localOrders + legacyCommandas,
    completedToday,
    cancelledToday,
    revenueToday: revenueToday._sum.totalAmount,
    channelBreakdown,
    typeBreakdown,
  };
}

export async function transitionOrderStatus(input: {
  orderId: string;
  toStatus: OrderStatus;
  note?: string;
  changedById?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
  });

  if (!order) {
    throw new ApiError(404, "Pedido nao encontrado.");
  }

  if (order.status === input.toStatus) {
    throw new ApiError(409, "O pedido ja esta neste status.");
  }

  if (!allowedTransitions[order.status].includes(input.toStatus)) {
    throw new ApiError(409, "Transicao de status invalida.");
  }

  const now = new Date();

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (input.toStatus === "pronto") {
      const orderState = await loadOrderOperationalState(tx, order.id);

      if (!orderState) {
        throw new ApiError(404, "Pedido nao encontrado.");
      }

      if (!orderState.operationalSummary.isFullyReady) {
        throw new ApiError(422, "Existem itens ainda nao prontos na cozinha.");
      }
    }

    await syncUnitStatusesForOrderTransition(tx, order.id, input.toStatus, now);

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.toStatus,
        acceptedById:
          input.toStatus === "em_preparo"
            ? input.changedById || order.acceptedById
            : order.acceptedById,
        acceptedAt: input.toStatus === "em_preparo" ? now : order.acceptedAt,
        preparedAt: input.toStatus === "pronto" ? now : order.preparedAt,
        dispatchedAt:
          input.toStatus === "saiu_para_entrega" ? now : order.dispatchedAt,
        deliveredAt: input.toStatus === "entregue" ? now : order.deliveredAt,
        cancelledAt: input.toStatus === "cancelado" ? now : order.cancelledAt,
        statusEvents: {
          create: {
            changedById: input.changedById,
            fromStatus: order.status,
            toStatus: input.toStatus,
            note: input.note || null,
          },
        },
      },
      include: {
        customerProfile: true,
        items: {
          include: {
            menuItem: true,
            units: {
              orderBy: { sequence: "asc" },
            },
          },
        },
        statusEvents: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await syncLinkedComandaStatus(tx, order.id, input.toStatus);

    return attachOrderOperationalSummary(updated as typeof updated & { comanda?: null });
  });

  const message = getStatusMessage(updatedOrder.code, input.toStatus, order.type);

  if (message && updatedOrder.customerPhone) {
    try {
      const result = await sendWhatsAppTextMessage({
        to: updatedOrder.customerPhone,
        body: message,
      });

      await recordOutboundOrderMessage(
        {
          id: updatedOrder.id,
          customerProfileId: updatedOrder.customerProfileId,
          customerName: updatedOrder.customerName,
          customerPhone: updatedOrder.customerPhone,
        },
        message,
        result.externalMessageId,
      );
    } catch (error) {
      console.error("[order-status:whatsapp]", error);
    }
  }

  return updatedOrder;
}
