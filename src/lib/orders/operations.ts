export type OrderItemUnitStatus = "novo" | "em_preparo" | "pronto" | "entregue" | "cancelado";

type UnitLike = {
  id: string;
  sequence: number;
  status: OrderItemUnitStatus;
  comandaEntryId?: string | null;
};

type ItemWithUnits = {
  units: UnitLike[];
};

export type OperationalSummary = {
  totalUnits: number;
  activeUnits: number;
  pendingUnits: number;
  preparingUnits: number;
  readyUnits: number;
  deliveredUnits: number;
  cancelledUnits: number;
  readyOrDeliveredUnits: number;
  isPartiallyReady: boolean;
  isFullyReady: boolean;
  isPartiallyDelivered: boolean;
  isFullyDelivered: boolean;
};

export const ORDER_ITEM_UNIT_TRANSITIONS: Record<OrderItemUnitStatus, OrderItemUnitStatus[]> = {
  novo: ["em_preparo", "cancelado"],
  em_preparo: ["pronto", "cancelado"],
  pronto: ["entregue"],
  entregue: [],
  cancelado: [],
};

export function summarizeUnits(units: UnitLike[]): OperationalSummary {
  const counts = units.reduce(
    (acc, unit) => {
      acc[unit.status] += 1;
      return acc;
    },
    {
      novo: 0,
      em_preparo: 0,
      pronto: 0,
      entregue: 0,
      cancelado: 0,
    } as Record<OrderItemUnitStatus, number>,
  );

  const totalUnits = units.length;
  const activeUnits = totalUnits - counts.cancelado;
  const readyOrDeliveredUnits = counts.pronto + counts.entregue;

  return {
    totalUnits,
    activeUnits,
    pendingUnits: counts.novo,
    preparingUnits: counts.em_preparo,
    readyUnits: counts.pronto,
    deliveredUnits: counts.entregue,
    cancelledUnits: counts.cancelado,
    readyOrDeliveredUnits,
    isPartiallyReady: readyOrDeliveredUnits > 0 && readyOrDeliveredUnits < activeUnits,
    isFullyReady: activeUnits > 0 && readyOrDeliveredUnits === activeUnits,
    isPartiallyDelivered: counts.entregue > 0 && counts.entregue < activeUnits,
    isFullyDelivered: activeUnits > 0 && counts.entregue === activeUnits,
  };
}

export function summarizeItems(items: ItemWithUnits[]): OperationalSummary {
  return summarizeUnits(items.flatMap((item) => item.units || []));
}

export function attachItemOperationalSummary<T extends ItemWithUnits>(item: T): T & { operationalSummary: OperationalSummary } {
  return {
    ...item,
    operationalSummary: summarizeUnits(item.units || []),
  } as T & { operationalSummary: OperationalSummary };
}

export function attachOrderOperationalSummary<
  T extends {
    items: ItemWithUnits[];
    comanda?: Record<string, unknown> | null;
  },
>(order: T): T & { operationalSummary: OperationalSummary } {
  const items = (order.items || []).map(attachItemOperationalSummary);
  const operationalSummary = summarizeItems(items);

  return {
    ...order,
    items,
    operationalSummary,
    comanda: order.comanda
      ? {
          ...order.comanda,
          operationalSummary,
        }
      : order.comanda,
  } as T & { operationalSummary: OperationalSummary };
}

export function attachComandaOperationalSummary<
  T extends {
    entries: ItemWithUnits[];
  },
>(comanda: T): T & { operationalSummary: OperationalSummary } {
  return {
    ...comanda,
    entries: (comanda.entries || []).map(attachItemOperationalSummary),
    operationalSummary: summarizeItems(comanda.entries || []),
  } as T & { operationalSummary: OperationalSummary };
}

export function buildUnitTimestampPatch(status: OrderItemUnitStatus, now: Date) {
  return {
    startedAt: status === "em_preparo" ? now : undefined,
    readyAt: status === "pronto" ? now : undefined,
    deliveredAt: status === "entregue" ? now : undefined,
    cancelledAt: status === "cancelado" ? now : undefined,
  };
}
