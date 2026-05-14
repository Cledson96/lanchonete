import type { OperationalSummary, OrderItemUnitStatus } from "@/lib/orders/operations";
import type {
  DashboardOrderDetail,
  OrderAction,
  OrderStatus,
  OrderType,
  PaymentMethod,
  UnitActionScope,
  UnitActionStatus,
} from "./types";

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(value));
}

export function formatPhone(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    return digits.replace(/^(55)(\d{2})(\d{5})(\d{4})$/, "+$1 ($2) $3-$4");
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    return digits.replace(/^(55)(\d{2})(\d{4})(\d{4})$/, "+$1 ($2) $3-$4");
  }
  return value || "—";
}

export function humanizeStatus(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    novo: "Novo",
    em_preparo: "Em preparo",
    pronto: "Pronto",
    saiu_para_entrega: "Saiu para entrega",
    entregue: "Entregue",
    fechado: "Fechado",
    cancelado: "Cancelado",
  };
  return map[status] ?? status;
}

export function humanizeType(type: OrderType) {
  if (type === "retirada") return "Retirada";
  if (type === "local") return "Consumo local";
  return "Delivery";
}

export function humanizePaymentMethod(value: PaymentMethod) {
  switch (value) {
    case "dinheiro":
      return "Dinheiro";
    case "cartao_credito":
      return "Cartão de crédito";
    case "cartao_debito":
      return "Cartão de débito";
    case "pix":
      return "Pix";
    case "outro":
      return "Outro";
    default:
      return "Não informado";
  }
}

export function humanizeUnitStatus(status: OrderItemUnitStatus) {
  switch (status) {
    case "novo":
      return "Novo";
    case "em_preparo":
      return "Em preparo";
    case "pronto":
      return "Pronto";
    case "entregue":
      return "Entregue";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
}

export function describeOperationalSummary(summary: OperationalSummary) {
  return [
    summary.pendingUnits ? `${summary.pendingUnits} novo(s)` : null,
    summary.preparingUnits ? `${summary.preparingUnits} em preparo` : null,
    summary.readyUnits ? `${summary.readyUnits} pronto(s)` : null,
    summary.deliveredUnits ? `${summary.deliveredUnits} entregue(s)` : null,
    summary.cancelledUnits ? `${summary.cancelledUnits} cancelado(s)` : null,
  ].filter(Boolean) as string[];
}

export function describeReadyState(summary: OperationalSummary) {
  if (summary.isFullyDelivered) return "Todos os itens já foram entregues.";
  if (summary.isFullyReady) return "Todos os itens estão prontos.";
  if (summary.isPartiallyDelivered) return "Parte dos itens já foi entregue.";
  if (summary.isPartiallyReady) return "Parte dos itens já está pronta.";
  return "Ainda há itens aguardando preparo.";
}

export function getUnitActions(unitStatus: OrderItemUnitStatus, orderType: OrderType, scope: UnitActionScope) {
  if (scope === "kitchen") {
    switch (unitStatus) {
      case "novo":
        return [{ toStatus: "em_preparo", label: "Iniciar" } satisfies { toStatus: UnitActionStatus; label: string }];
      case "em_preparo":
        return [{ toStatus: "pronto", label: "Pronto" } satisfies { toStatus: UnitActionStatus; label: string }];
      default:
        return [] as Array<{ toStatus: UnitActionStatus; label: string }>;
    }
  }

  switch (unitStatus) {
    case "pronto":
      return orderType === "local"
        ? [{ toStatus: "entregue", label: "Entregue" } satisfies { toStatus: UnitActionStatus; label: string }]
        : [];
    default:
      return [] as Array<{ toStatus: UnitActionStatus; label: string }>;
  }
}

export function getActions(order: DashboardOrderDetail, scope: UnitActionScope): OrderAction[] {
  if (scope === "kitchen") {
    return [];
  }

  switch (order.status) {
    case "novo":
      return [{ toStatus: "cancelado", label: "Cancelar", tone: "danger" }];
    case "em_preparo":
      return [{ toStatus: "cancelado", label: "Cancelar", tone: "danger" }];
    case "pronto":
      return order.type === "delivery"
        ? [{ toStatus: "saiu_para_entrega", label: "Saiu para entrega", tone: "primary" }]
        : [{ toStatus: "entregue", label: "Marcar entregue", tone: "success" }];
    case "saiu_para_entrega":
      return [{ toStatus: "entregue", label: "Marcar entregue", tone: "success" }];
    case "entregue":
      return [{ toStatus: "fechado", label: "Fechar pedido", tone: "neutral" }];
    default:
      return [];
  }
}

export function actionClassName(tone: OrderAction["tone"]) {
  if (tone === "danger") return "border border-red-200 bg-white text-red-600 hover:bg-red-50";
  if (tone === "success") return "bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]";
  if (tone === "neutral") return "border border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[var(--background)]";
  return "bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange-dark)]";
}
