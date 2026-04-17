"use client";

import { useEffect } from "react";
import { formatMoney } from "@/lib/utils";

type OrderStatus =
  | "novo"
  | "em_preparo"
  | "pronto"
  | "saiu_para_entrega"
  | "entregue"
  | "fechado"
  | "cancelado";

type OrderType = "delivery" | "retirada" | "local";
type OrderChannel = "web" | "whatsapp" | "local";

type PaymentMethod =
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "pix"
  | "outro"
  | null;

export type DashboardOrderDetail = {
  id: string;
  code: string;
  channel: OrderChannel;
  type: OrderType;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  totalAmount: number | string;
  subtotalAmount: number | string;
  deliveryFeeAmount: number | string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  createdAt: string;
  acceptedAt: string | null;
  preparedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  comanda?: {
    id: string;
    code: string;
    name: string | null;
    notes: string | null;
    totalAmount: number | string;
    entries: Array<{ id: string }>;
  } | null;
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string | null;
    reference?: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    subtotalAmount: number | string;
    notes: string | null;
    menuItem: {
      name: string;
      imageUrl?: string | null;
    };
    selectedOptions: Array<{
      quantity: number;
      unitPriceDelta: number | string;
      optionItem: {
        name: string;
      };
    }>;
    ingredientCustomizations: Array<{
      quantity: number;
      ingredient: {
        name: string;
      };
    }>;
  }>;
  statusEvents: Array<{
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    note: string | null;
    createdAt: string;
    changedBy?: {
      name?: string | null;
      email?: string | null;
    } | null;
  }>;
};

type OrderAction = {
  toStatus: OrderStatus;
  label: string;
  tone?: "primary" | "success" | "neutral" | "danger";
};

type Props = {
  order: DashboardOrderDetail | null;
  loading: boolean;
  onClose: () => void;
  onTransition: (toStatus: OrderStatus) => Promise<void>;
  pendingStatus: OrderStatus | null;
  feedback: string | null;
  error: string | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(value));
}

function formatPhone(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    return digits.replace(/^(55)(\d{2})(\d{5})(\d{4})$/, "+$1 ($2) $3-$4");
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    return digits.replace(/^(55)(\d{2})(\d{4})(\d{4})$/, "+$1 ($2) $3-$4");
  }
  return value || "—";
}

function humanizeStatus(status: OrderStatus) {
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

function humanizeType(type: OrderType) {
  if (type === "retirada") return "Retirada";
  if (type === "local") return "Consumo local";
  return "Delivery";
}

function humanizePaymentMethod(value: PaymentMethod) {
  switch (value) {
    case "dinheiro": return "Dinheiro";
    case "cartao_credito": return "Cartão de crédito";
    case "cartao_debito": return "Cartão de débito";
    case "pix": return "Pix";
    case "outro": return "Outro";
    default: return "Não informado";
  }
}

const statusStyle: Record<OrderStatus, string> = {
  novo: "bg-amber-100 text-amber-700 border-amber-200",
  em_preparo: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)] border-[var(--brand-orange)]/30",
  pronto: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)] border-[var(--brand-green)]/30",
  saiu_para_entrega: "bg-sky-100 text-sky-700 border-sky-200",
  entregue: "bg-emerald-100 text-emerald-700 border-emerald-200",
  fechado: "bg-[var(--background-strong)] text-[var(--muted)] border-[var(--line)]",
  cancelado: "bg-red-100 text-red-700 border-red-200",
};

const channelStyle: Record<OrderChannel, { label: string; cls: string }> = {
  web: { label: "Web", cls: "bg-sky-100 text-sky-700" },
  whatsapp: { label: "WhatsApp", cls: "bg-emerald-100 text-emerald-700" },
  local: { label: "Balcão", cls: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]" },
};

function getActions(order: DashboardOrderDetail): OrderAction[] {
  switch (order.status) {
    case "novo":
      return [
        { toStatus: "em_preparo", label: "Iniciar preparo", tone: "primary" },
        { toStatus: "cancelado", label: "Cancelar", tone: "danger" },
      ];
    case "em_preparo":
      return [
        { toStatus: "pronto", label: "Marcar pronto", tone: "success" },
        { toStatus: "cancelado", label: "Cancelar", tone: "danger" },
      ];
    case "pronto":
      return order.type === "delivery"
        ? [{ toStatus: "saiu_para_entrega", label: "Saiu para entrega", tone: "primary" }]
        : [{ toStatus: "fechado", label: "Fechar pedido", tone: "success" }];
    case "saiu_para_entrega":
      return [{ toStatus: "entregue", label: "Marcar entregue", tone: "success" }];
    case "entregue":
      return [{ toStatus: "fechado", label: "Fechar pedido", tone: "neutral" }];
    default:
      return [];
  }
}

function actionClassName(tone: OrderAction["tone"]) {
  if (tone === "danger") return "border border-red-200 bg-white text-red-600 hover:bg-red-50";
  if (tone === "success") return "bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]";
  if (tone === "neutral") return "border border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[var(--background)]";
  return "bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange-dark)]";
}

/* ───── Ícones ───── */

function CloseIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-3.5 w-3.5">
      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ───── Principal ───── */

export function DashboardOrderDetailSheet({
  order,
  loading,
  onClose,
  onTransition,
  pendingStatus,
  feedback,
  error,
}: Props) {
  // Fecha ao apertar ESC
  useEffect(() => {
    if (!order && !loading) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [order, loading, onClose]);

  if (!order && !loading) return null;

  const actions = order ? getActions(order) : [];
  const totalItems = order ? order.items.reduce((s, i) => s + i.quantity, 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(45,24,11,0.4)] backdrop-blur-[3px]">
      <button aria-label="Fechar painel" className="flex-1 cursor-default" onClick={onClose} type="button" />

      <aside className="flex h-full w-full max-w-[34rem] flex-col bg-[var(--surface)] text-[var(--foreground)] shadow-[0_24px_80px_rgba(45,24,11,0.24)]">

        {/* ─── Sticky Header ─── */}
        <header className="sticky top-0 z-10 shrink-0 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          {loading || !order ? (
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--muted)]">Carregando pedido…</p>
              <button
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
                onClick={onClose}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Pedido</p>
                    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold ${channelStyle[order.channel].cls}`}>
                      {channelStyle[order.channel].label}
                    </span>
                  </div>
                  <h2 className="mt-0.5 truncate text-xl font-bold tracking-tight">
                    {order.code.slice(0, 8)}
                  </h2>
                </div>
                <button
                  aria-label="Fechar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
                  onClick={onClose}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[order.status]}`}>
                  {humanizeStatus(order.status)}
                </span>
                <span className="text-xs text-[var(--muted)]">•</span>
                <span className="text-xs font-medium text-[var(--muted)]">{humanizeType(order.type)}</span>
                <span className="text-xs text-[var(--muted)]">•</span>
                <span className="text-xs text-[var(--muted)]">{formatTime(order.createdAt)}</span>
              </div>
            </>
          )}
        </header>

        {/* ─── Conteúdo scroll ─── */}
        <div className="flex-1 overflow-y-auto">
          {loading || !order ? (
            <div className="p-5">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                Carregando detalhes…
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-5">

              {/* Cliente */}
              <section className="rounded-xl border border-[var(--line)] bg-white p-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Cliente</p>
                <p className="mt-1 text-base font-semibold">{order.customerName || "Sem nome"}</p>
                {order.customerPhone ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <PhoneIcon />
                    {formatPhone(order.customerPhone)}
                  </p>
                ) : null}
              </section>

              {order.comanda ? (
                <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-700">Comanda vinculada</p>
                      <p className="mt-1 text-base font-semibold text-violet-950">
                        {order.comanda.name?.trim() || `Comanda ${order.comanda.code.slice(0, 8)}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[0.7rem] font-semibold text-violet-700">
                      {order.comanda.entries.length} lançamento(s)
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-violet-700/80">Código</p>
                      <p className="mt-0.5 font-semibold text-violet-950">{order.comanda.code.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-violet-700/80">Total da comanda</p>
                      <p className="mt-0.5 font-semibold text-violet-950">{formatMoney(toNumber(order.comanda.totalAmount))}</p>
                    </div>
                  </div>
                  {order.comanda.notes ? (
                    <p className="mt-3 text-sm leading-5 text-violet-900">
                      <span className="font-semibold">Obs. da comanda:</span> {order.comanda.notes}
                    </p>
                  ) : null}
                </section>
              ) : null}

              {/* Resumo financeiro */}
              <section className="rounded-xl border border-[var(--line)] bg-white p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Subtotal</p>
                    <p className="mt-0.5 text-sm font-semibold">{formatMoney(toNumber(order.subtotalAmount))}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Frete</p>
                    <p className="mt-0.5 text-sm font-semibold">{formatMoney(toNumber(order.deliveryFeeAmount))}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Pagamento</p>
                    <p className="mt-0.5 truncate text-sm font-semibold">{humanizePaymentMethod(order.paymentMethod)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
                  <p className="text-sm font-semibold text-[var(--muted)]">Total</p>
                  <p className="text-xl font-bold text-[var(--brand-orange-dark)]">
                    {formatMoney(toNumber(order.totalAmount))}
                  </p>
                </div>
              </section>

              {/* Endereço */}
              {order.deliveryAddress ? (
                <section className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]">
                      <MapPinIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Endereço de entrega</p>
                      <p className="mt-1 text-sm leading-5 text-[var(--foreground)]">
                        {order.deliveryAddress.street}, {order.deliveryAddress.number}
                        {order.deliveryAddress.complement ? ` • ${order.deliveryAddress.complement}` : ""}
                      </p>
                      <p className="text-xs leading-5 text-[var(--muted)]">
                        {order.deliveryAddress.neighborhood} • {order.deliveryAddress.city}/{order.deliveryAddress.state}
                        {order.deliveryAddress.zipCode ? ` • CEP ${order.deliveryAddress.zipCode}` : ""}
                      </p>
                      {order.deliveryAddress.reference ? (
                        <p className="mt-1 text-xs italic text-[var(--muted)]">Referência: {order.deliveryAddress.reference}</p>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}

              {/* Observação geral */}
              {order.notes ? (
                <section className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <span className="mt-0.5 shrink-0 text-amber-600">
                    <InfoIcon />
                  </span>
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em]">Observação do cliente</p>
                    <p className="mt-1 text-sm leading-5">{order.notes}</p>
                  </div>
                </section>
              ) : null}

              {/* Itens */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Itens do pedido
                  </p>
                  <span className="rounded-full bg-[var(--brand-green)]/12 px-2 py-0.5 text-[0.65rem] font-bold text-[var(--brand-green-dark)]">
                    {totalItems} {totalItems === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
                  {order.items.map((item, idx) => {
                    const extras = item.selectedOptions.filter((o) => o.optionItem.name);
                    const modifiedIngredients = item.ingredientCustomizations.filter((i) => i.quantity !== 1);

                    return (
                      <article
                        key={item.id}
                        className={`p-4 ${idx > 0 ? "border-t border-[var(--line)]" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2">
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--brand-orange)]/10 text-xs font-bold text-[var(--brand-orange-dark)]">
                              {item.quantity}×
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-tight">{item.menuItem.name}</p>
                              <p className="mt-0.5 text-[0.7rem] text-[var(--muted)]">
                                Unitário {formatMoney(toNumber(item.unitPrice))}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 text-sm font-bold">{formatMoney(toNumber(item.subtotalAmount))}</p>
                        </div>

                        {extras.length ? (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {extras.map((opt, i) => (
                              <span
                                key={`${item.id}-opt-${i}`}
                                className="inline-flex items-center gap-1 rounded-md bg-[var(--brand-green)]/10 px-2 py-0.5 text-[0.7rem] font-medium text-[var(--brand-green-dark)]"
                              >
                                + {opt.quantity > 1 ? `${opt.quantity}× ` : ""}{opt.optionItem.name}
                                {toNumber(opt.unitPriceDelta) > 0 ? (
                                  <span className="text-[var(--muted)]">
                                    ({formatMoney(toNumber(opt.unitPriceDelta))})
                                  </span>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {modifiedIngredients.length ? (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {modifiedIngredients.map((ing, i) => (
                              <span
                                key={`${item.id}-ing-${i}`}
                                className={`inline-flex rounded-md px-2 py-0.5 text-[0.7rem] font-medium ${
                                  ing.quantity === 0
                                    ? "bg-red-50 text-red-600 line-through"
                                    : "bg-sky-50 text-sky-700"
                                }`}
                              >
                                {ing.quantity === 0 ? `sem ${ing.ingredient.name}` : `${ing.quantity}× ${ing.ingredient.name}`}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {item.notes ? (
                          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[0.7rem] text-amber-800">
                            <span className="shrink-0 font-bold">Obs:</span>
                            <span className="leading-4">{item.notes}</span>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Histórico (timeline) */}
              {order.statusEvents.length ? (
                <section>
                  <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Histórico
                  </p>
                  <ol className="relative space-y-3 border-l-2 border-[var(--line)] pl-4">
                    {order.statusEvents.map((event) => (
                      <li key={event.id} className="relative">
                        <span className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full border-2 border-[var(--brand-orange)] bg-white" />
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {event.fromStatus
                              ? <>
                                  <span className="text-[var(--muted)]">{humanizeStatus(event.fromStatus)}</span>
                                  <span className="mx-1 text-[var(--muted)]">→</span>
                                  {humanizeStatus(event.toStatus)}
                                </>
                              : humanizeStatus(event.toStatus)}
                          </p>
                          <span className="shrink-0 text-[0.7rem] text-[var(--muted)]">{formatDateTime(event.createdAt)}</span>
                        </div>
                        {event.note ? <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">{event.note}</p> : null}
                        {event.changedBy?.email || event.changedBy?.name ? (
                          <p className="mt-0.5 text-[0.7rem] italic text-[var(--muted)]">
                            por {event.changedBy.name || event.changedBy.email}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </div>
          )}
        </div>

        {/* ─── Sticky Footer com ações ─── */}
        {order && !loading ? (
          <footer className="sticky bottom-0 shrink-0 border-t border-[var(--line)] bg-white p-4 shadow-[0_-4px_20px_rgba(45,24,11,0.06)]">
            {feedback ? (
              <div className="mb-2.5 rounded-lg border border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 px-3 py-2 text-xs font-medium text-[var(--brand-green-dark)]">
                {feedback}
              </div>
            ) : null}
            {error ? (
              <div className="mb-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {actions.length ? (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <button
                    key={action.toStatus}
                    className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${actionClassName(action.tone)}`}
                    disabled={pendingStatus !== null}
                    onClick={() => void onTransition(action.toStatus)}
                    type="button"
                  >
                    {pendingStatus === action.toStatus ? "Atualizando…" : action.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-[var(--background)] px-3 py-2 text-center text-xs text-[var(--muted)]">
                Nenhuma ação disponível para este status.
              </p>
            )}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
