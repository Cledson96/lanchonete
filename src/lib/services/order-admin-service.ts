import { OrderStatus } from "@prisma/client";
import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp";
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
    include: {
      customerProfile: true,
      acceptedBy: true,
      items: {
        include: {
          menuItem: true,
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
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customerProfile: true,
      deliveryAddress: true,
      deliveryFeeRule: true,
      acceptedBy: true,
      items: {
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
      statusEvents: {
        orderBy: { createdAt: "asc" },
        include: {
          changedBy: true,
        },
      },
    },
  });
}

export async function getDashboardMetrics() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const completedStatuses: OrderStatus[] = ["entregue", "fechado"];

  const [
    newOrders,
    preparingOrders,
    dispatchingOrders,
    openCommandas,
    completedToday,
    cancelledToday,
    revenueToday,
    channelBreakdown,
    typeBreakdown,
  ] =
    await Promise.all([
      prisma.order.count({ where: { status: "novo" } }),
      prisma.order.count({ where: { status: "em_preparo" } }),
      prisma.order.count({ where: { status: "saiu_para_entrega" } }),
      prisma.comanda.count({ where: { status: { notIn: ["fechado", "cancelado"] } } }),
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
    openCommandas,
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
          },
        },
        statusEvents: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return updated;
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
