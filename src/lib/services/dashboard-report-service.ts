import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncLegacyCommandasToOrders } from "@/lib/services/comanda-service";
import { syncMissingOrderItemUnits } from "@/lib/services/order-item-unit-service";

export type ReportPeriod = "today" | "week" | "month" | "custom";
export type ReportAmountMode = "total" | "subtotal";
export type ReportPaymentMethod = "all" | PaymentMethod;

export type ReportFilterInput = {
  period?: string;
  from?: string;
  to?: string;
  paymentMethod?: string;
  amountMode?: string;
};

const completedStatuses: OrderStatus[] = ["entregue", "fechado"];
const reportPeriods: ReportPeriod[] = ["today", "week", "month", "custom"];
const amountModes: ReportAmountMode[] = ["total", "subtotal"];
const paymentMethods: PaymentMethod[] = [
  "pix",
  "cartao_credito",
  "cartao_debito",
  "dinheiro",
  "outro",
];

function toNumber(value?: Prisma.Decimal | number | string | null) {
  return Number(value ?? 0);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseInputDate(value?: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(start: Date, endExclusive: Date) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
  return `${formatter.format(start)} ate ${formatter.format(addDays(endExclusive, -1))}`;
}

function normalizeFilters(input: ReportFilterInput = {}) {
  const now = new Date();
  const period = reportPeriods.includes(input.period as ReportPeriod)
    ? (input.period as ReportPeriod)
    : "month";
  const paymentMethod: ReportPaymentMethod = paymentMethods.includes(
    input.paymentMethod as PaymentMethod,
  )
    ? (input.paymentMethod as PaymentMethod)
    : "all";
  const amountMode: ReportAmountMode = amountModes.includes(
    input.amountMode as ReportAmountMode,
  )
    ? (input.amountMode as ReportAmountMode)
    : "total";

  let start = startOfMonth(now);
  let endExclusive = addMonths(start, 1);

  if (period === "today") {
    start = startOfDay(now);
    endExclusive = addDays(start, 1);
  }

  if (period === "week") {
    start = startOfWeek(now);
    endExclusive = addDays(start, 7);
  }

  if (period === "custom") {
    const customStart = parseInputDate(input.from);
    const customEnd = parseInputDate(input.to);

    if (customStart && customEnd) {
      start = startOfDay(customStart);
      endExclusive = addDays(startOfDay(customEnd), 1);
    }
  }

  if (start >= endExclusive) {
    start = startOfMonth(now);
    endExclusive = addMonths(start, 1);
  }

  return {
    period,
    paymentMethod,
    amountMode,
    start,
    endExclusive,
    fromInput: formatInputDate(start),
    toInput: formatInputDate(addDays(endExclusive, -1)),
    label: formatDateLabel(start, endExclusive),
  };
}

function buildPeriodWhere(filters: ReturnType<typeof normalizeFilters>) {
  const where: Prisma.OrderWhereInput = {
    createdAt: {
      gte: filters.start,
      lt: filters.endExclusive,
    },
  };

  if (filters.paymentMethod !== "all") {
    where.paymentMethod = filters.paymentMethod;
  }

  return where;
}

function getPaymentLabel(paymentMethod: PaymentMethod | null) {
  const labels: Record<PaymentMethod, string> = {
    pix: "Pix",
    cartao_credito: "Cartao de credito",
    cartao_debito: "Cartao de debito",
    dinheiro: "Dinheiro",
    outro: "Outro",
  };

  return paymentMethod ? labels[paymentMethod] : "Nao informado";
}

export async function getOperationsReport(input: ReportFilterInput = {}) {
  await syncLegacyCommandasToOrders();
  await syncMissingOrderItemUnits();

  const filters = normalizeFilters(input);
  const periodWhere = buildPeriodWhere(filters);
  const completedWhere: Prisma.OrderWhereInput = {
    ...periodWhere,
    OR: [
      { status: { in: completedStatuses } },
      {
        channel: "local",
        comanda: {
          is: {
            status: "fechado",
          },
        },
      },
    ],
  };

  const [orders, cancelledOrders] = await Promise.all([
    prisma.order.findMany({
      where: completedWhere,
      orderBy: { createdAt: "desc" },
      include: {
        comanda: {
          select: {
            status: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
              },
            },
            ingredientCustomizations: {
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
      },
    }),
    prisma.order.count({
      where: {
        ...periodWhere,
        status: "cancelado",
      },
    }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0);
  const subtotalRevenue = orders.reduce((sum, order) => sum + toNumber(order.subtotalAmount), 0);
  const deliveryFeeRevenue = orders.reduce((sum, order) => sum + toNumber(order.deliveryFeeAmount), 0);
  const itemUnitsSold = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const selectedRevenue = filters.amountMode === "subtotal" ? subtotalRevenue : totalRevenue;

  const paymentStats = new Map<
    PaymentMethod | null,
    {
      paymentMethod: PaymentMethod | null;
      label: string;
      orderCount: number;
      totalAmount: number;
      subtotalAmount: number;
      deliveryFeeAmount: number;
      averageTicket: number;
      selectedAmount: number;
    }
  >();
  const menuItemStats = new Map<
    string,
    {
      menuItemId: string;
      name: string;
      quantity: number;
      revenue: number;
      participation: number;
    }
  >();
  const usedIngredientStats = new Map<
    string,
    {
      ingredientId: string;
      name: string;
      quantity: number;
    }
  >();
  const removedIngredientStats = new Map<
    string,
    {
      ingredientId: string;
      name: string;
      removals: number;
    }
  >();

  for (const order of orders) {
    const paymentKey = order.paymentMethod;
    const payment = paymentStats.get(paymentKey) || {
      paymentMethod: paymentKey,
      label: getPaymentLabel(paymentKey),
      orderCount: 0,
      totalAmount: 0,
      subtotalAmount: 0,
      deliveryFeeAmount: 0,
      averageTicket: 0,
      selectedAmount: 0,
    };

    payment.orderCount += 1;
    payment.totalAmount += toNumber(order.totalAmount);
    payment.subtotalAmount += toNumber(order.subtotalAmount);
    payment.deliveryFeeAmount += toNumber(order.deliveryFeeAmount);
    payment.selectedAmount +=
      filters.amountMode === "subtotal"
        ? toNumber(order.subtotalAmount)
        : toNumber(order.totalAmount);
    payment.averageTicket = payment.orderCount
      ? payment.selectedAmount / payment.orderCount
      : 0;
    paymentStats.set(paymentKey, payment);

    for (const item of order.items) {
      const menuItem = menuItemStats.get(item.menuItemId) || {
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        quantity: 0,
        revenue: 0,
        participation: 0,
      };

      menuItem.quantity += item.quantity;
      menuItem.revenue += toNumber(item.subtotalAmount);
      menuItemStats.set(item.menuItemId, menuItem);

      for (const customization of item.ingredientCustomizations) {
        if (customization.quantity > 0) {
          const current = usedIngredientStats.get(customization.ingredientId) || {
            ingredientId: customization.ingredientId,
            name: customization.ingredient.name,
            quantity: 0,
          };

          current.quantity += customization.quantity * item.quantity;
          usedIngredientStats.set(customization.ingredientId, current);
        }

        if (customization.quantity === 0) {
          const current = removedIngredientStats.get(customization.ingredientId) || {
            ingredientId: customization.ingredientId,
            name: customization.ingredient.name,
            removals: 0,
          };

          current.removals += item.quantity;
          removedIngredientStats.set(customization.ingredientId, current);
        }
      }
    }
  }

  const topMenuItems = [...menuItemStats.values()]
    .map((item) => ({
      ...item,
      participation: itemUnitsSold ? (item.quantity / itemUnitsSold) * 100 : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 10);

  return {
    filters,
    summary: {
      completedOrders: orders.length,
      cancelledOrders,
      totalRevenue,
      subtotalRevenue,
      deliveryFeeRevenue,
      selectedRevenue,
      averageTicket: orders.length ? selectedRevenue / orders.length : 0,
      itemUnitsSold,
    },
    paymentBreakdown: [...paymentStats.values()].sort(
      (a, b) => b.selectedAmount - a.selectedAmount,
    ),
    topMenuItems,
    topIngredients: [...usedIngredientStats.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10),
    removedIngredients: [...removedIngredientStats.values()]
      .sort((a, b) => b.removals - a.removals)
      .slice(0, 10),
    recentOrders: orders.slice(0, 20).map((order) => ({
      id: order.id,
      code: order.code,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      status:
        order.channel === "local" && order.comanda?.status === "fechado"
          ? "fechado"
          : order.status,
      paymentMethod: order.paymentMethod,
      type: order.type,
      subtotalAmount: toNumber(order.subtotalAmount),
      deliveryFeeAmount: toNumber(order.deliveryFeeAmount),
      totalAmount: toNumber(order.totalAmount),
    })),
  };
}
