import type { OrderChannel, OrderStatus } from "./types";
import type { OrderItemUnitStatus } from "@/lib/orders/operations";

export const statusStyle: Record<OrderStatus, string> = {
  novo: "bg-amber-100 text-amber-700 border-amber-200",
  em_preparo: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)] border-[var(--brand-orange)]/30",
  pronto: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)] border-[var(--brand-green)]/30",
  saiu_para_entrega: "bg-sky-100 text-sky-700 border-sky-200",
  entregue: "bg-emerald-100 text-emerald-700 border-emerald-200",
  fechado: "bg-[var(--background-strong)] text-[var(--muted)] border-[var(--line)]",
  cancelado: "bg-red-100 text-red-700 border-red-200",
};

export const channelStyle: Record<OrderChannel, { label: string; cls: string }> = {
  web: { label: "Web", cls: "bg-sky-100 text-sky-700" },
  whatsapp: { label: "WhatsApp", cls: "bg-emerald-100 text-emerald-700" },
  local: { label: "Balcão", cls: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]" },
};

export const unitStatusStyle: Record<OrderItemUnitStatus, string> = {
  novo: "bg-amber-100 text-amber-700 border-amber-200",
  em_preparo: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)] border-[var(--brand-orange)]/30",
  pronto: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)] border-[var(--brand-green)]/30",
  entregue: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
};
