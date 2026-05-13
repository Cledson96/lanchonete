import type { ReactNode } from "react";
import type { ColumnConfig, DashboardOrderView, OrderChannel } from "./types";

export const columnsByView: Record<DashboardOrderView, ColumnConfig[]> = {
  operation: [
    { status: "novo", label: "Novos", accent: "border-t-amber-400", headerBg: "bg-amber-50", countBg: "bg-amber-100 text-amber-700" },
    { status: "em_preparo", label: "Em preparo", accent: "border-t-[var(--brand-orange)]", headerBg: "bg-[var(--brand-orange)]/5", countBg: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]" },
    { status: "pronto", label: "Prontos", accent: "border-t-[var(--brand-green)]", headerBg: "bg-[var(--brand-green)]/5", countBg: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]" },
    { status: "saiu_para_entrega", label: "Saindo", accent: "border-t-sky-400", headerBg: "bg-sky-50", countBg: "bg-sky-100 text-sky-700" },
  ],
  kitchen: [
    { status: "novo", label: "Novos", accent: "border-t-amber-400", headerBg: "bg-amber-50", countBg: "bg-amber-100 text-amber-700" },
    { status: "em_preparo", label: "Em preparo", accent: "border-t-[var(--brand-orange)]", headerBg: "bg-[var(--brand-orange)]/5", countBg: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]" },
    { status: "pronto", label: "Prontos", accent: "border-t-[var(--brand-green)]", headerBg: "bg-[var(--brand-green)]/5", countBg: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]" },
  ],
  dispatch: [
    { status: "pronto", label: "Prontos", accent: "border-t-[var(--brand-green)]", headerBg: "bg-[var(--brand-green)]/5", countBg: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]" },
    { status: "saiu_para_entrega", label: "Saindo", accent: "border-t-sky-400", headerBg: "bg-sky-50", countBg: "bg-sky-100 text-sky-700" },
  ],
  archive: [
    { status: "entregue", label: "Entregues", accent: "border-t-[var(--brand-green)]", headerBg: "bg-[var(--brand-green)]/5", countBg: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]" },
    { status: "fechado", label: "Fechados", accent: "border-t-[var(--line)]", headerBg: "bg-[var(--background-strong)]", countBg: "bg-[var(--background-strong)] text-[var(--muted)]" },
    { status: "cancelado", label: "Cancelados", accent: "border-t-red-400", headerBg: "bg-red-50", countBg: "bg-red-100 text-red-700" },
  ],
};

export const channelMeta: Record<OrderChannel, { label: string; stripe: string; badge: string; icon: ReactNode }> = {
  web: {
    label: "Web",
    stripe: "bg-sky-400",
    badge: "bg-sky-100 text-sky-700",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="h-3 w-3">
        <path d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0a8.993 8.993 0 01-3.6-7.2M12 21a8.993 8.993 0 003.6-7.2M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  whatsapp: {
    label: "WhatsApp",
    stripe: "bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="h-3 w-3">
        <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  local: {
    label: "Balcão",
    stripe: "bg-[var(--brand-orange)]",
    badge: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="h-3 w-3">
        <path d="M2.25 21h19.5m-18-18v18m10.5-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};
