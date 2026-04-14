"use client";

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
  channel: "web" | "whatsapp" | "local";
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
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
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
  return status.replaceAll("_", " ");
}

function humanizeType(type: OrderType) {
  if (type === "retirada") {
    return "retirada";
  }

  if (type === "local") {
    return "consumo local";
  }

  return "delivery";
}

function humanizePaymentMethod(value: PaymentMethod) {
  switch (value) {
    case "dinheiro":
      return "Dinheiro";
    case "cartao_credito":
      return "Cartao de credito";
    case "cartao_debito":
      return "Cartao de debito";
    case "pix":
      return "Pix";
    case "outro":
      return "Outro";
    default:
      return "Nao informado";
  }
}

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
  if (tone === "danger") {
    return "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100";
  }

  if (tone === "success") {
    return "border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/12 text-[var(--brand-green-dark)] hover:bg-[var(--brand-green)]/18";
  }

  if (tone === "neutral") {
    return "border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--background-strong)]";
  }

  return "bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange-dark)]";
}

export function DashboardOrderDetailSheet({
  order,
  loading,
  onClose,
  onTransition,
  pendingStatus,
  feedback,
  error,
}: Props) {
  if (!order && !loading) {
    return null;
  }

  const actions = order ? getActions(order) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(45,24,11,0.24)] backdrop-blur-[2px]">
      <button aria-label="Fechar painel" className="flex-1 cursor-default" onClick={onClose} type="button" />
      <aside className="flex h-full w-full max-w-[36rem] flex-col overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)] px-6 py-6 text-[var(--foreground)] shadow-[0_24px_80px_rgba(45,24,11,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <p className="eyebrow text-[var(--muted)]">Detalhe do pedido</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {loading || !order ? "Carregando pedido..." : `Pedido ${order.code}`}
            </h2>
            {order ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {humanizeStatus(order.status)} • {humanizeType(order.type)} • {order.channel}
              </p>
            ) : null}
          </div>
          <button
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--background)]"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </div>

        {loading || !order ? (
          <div className="mt-6 rounded-[1.6rem] border border-[var(--line)] bg-[var(--background)] px-5 py-6 text-sm text-[var(--muted)]">
            Carregando os detalhes completos do pedido...
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Cliente</p>
                <p className="mt-3 text-lg font-semibold">{order.customerName || "Cliente"}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{formatPhone(order.customerPhone)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Pagamento</p>
                <p className="mt-3 text-lg font-semibold">{humanizePaymentMethod(order.paymentMethod)}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Status: {order.paymentStatus.replaceAll("_", " ")}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                <span>Criado em {formatDateTime(order.createdAt)}</span>
                <span>•</span>
                <span>Total {formatMoney(toNumber(order.totalAmount))}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Subtotal</p>
                  <p className="mt-2 font-semibold">{formatMoney(toNumber(order.subtotalAmount))}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Frete</p>
                  <p className="mt-2 font-semibold">{formatMoney(toNumber(order.deliveryFeeAmount))}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Tipo</p>
                  <p className="mt-2 font-semibold capitalize">{humanizeType(order.type)}</p>
                </div>
              </div>
            </div>

            {order.deliveryAddress ? (
              <div className="mt-4 rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Endereco</p>
                <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                  {order.deliveryAddress.street}, {order.deliveryAddress.number}
                  {order.deliveryAddress.complement ? ` • ${order.deliveryAddress.complement}` : ""}
                  <br />
                  {order.deliveryAddress.neighborhood} • {order.deliveryAddress.city}/{order.deliveryAddress.state}
                  {order.deliveryAddress.zipCode ? ` • CEP ${order.deliveryAddress.zipCode}` : ""}
                </p>
                {order.deliveryAddress.reference ? (
                  <p className="mt-3 text-sm text-[var(--muted)]">Referencia: {order.deliveryAddress.reference}</p>
                ) : null}
              </div>
            ) : null}

            {order.notes ? (
              <div className="mt-4 rounded-[1.5rem] border border-[var(--brand-orange)]/25 bg-[var(--brand-orange)]/8 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-orange-dark)]">Observacao geral</p>
                <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">{order.notes}</p>
              </div>
            ) : null}

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-[var(--muted)]">Itens do pedido</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">O que foi pedido</h3>
                </div>
                <span className="rounded-full bg-[var(--brand-green)]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-dark)]">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} itens
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <article key={item.id} className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 shadow-[0_10px_24px_rgba(45,24,11,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-base font-semibold">
                          {item.quantity}x {item.menuItem.name}
                        </p>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          Unitario {formatMoney(toNumber(item.unitPrice))}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{formatMoney(toNumber(item.subtotalAmount))}</p>
                    </div>

                    {item.selectedOptions.length ? (
                      <div className="mt-3 rounded-[1.1rem] bg-[var(--background)] px-3 py-3 text-sm text-[var(--muted)]">
                        <p className="font-semibold text-[var(--foreground)]">Adicionais</p>
                        <ul className="mt-2 space-y-1.5">
                          {item.selectedOptions.map((option, index) => (
                            <li key={`${item.id}-option-${index}`}>
                              {option.quantity}x {option.optionItem.name}
                              {toNumber(option.unitPriceDelta) > 0
                                ? ` • +${formatMoney(toNumber(option.unitPriceDelta))}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {item.notes ? (
                      <div className="mt-3 rounded-[1.1rem] border border-[var(--brand-orange)]/20 bg-[var(--brand-orange)]/8 px-3 py-3 text-sm text-[var(--foreground)]">
                        <p className="font-semibold text-[var(--brand-orange-dark)]">Observacao do item</p>
                        <p className="mt-1 leading-6">{item.notes}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="eyebrow text-[var(--muted)]">Historico</p>
              <div className="mt-3 space-y-3">
                {order.statusEvents.length ? (
                  order.statusEvents.map((event) => (
                    <div key={event.id} className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {event.fromStatus ? `${humanizeStatus(event.fromStatus)} → ` : ""}
                          {humanizeStatus(event.toStatus)}
                        </p>
                        <span className="text-xs text-[var(--muted)]">{formatDateTime(event.createdAt)}</span>
                      </div>
                      {event.note ? <p className="mt-2 text-sm text-[var(--foreground)]">{event.note}</p> : null}
                      {event.changedBy?.email || event.changedBy?.name ? (
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          por {event.changedBy.name || event.changedBy.email}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4 text-sm text-[var(--muted)]">
                    Nenhum evento de status registrado ainda.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <p className="eyebrow text-[var(--muted)]">Acoes rapidas</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {actions.length ? (
                  actions.map((action) => (
                    <button
                      key={action.toStatus}
                      className={`rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${actionClassName(action.tone)}`}
                      disabled={pendingStatus !== null}
                      onClick={() => void onTransition(action.toStatus)}
                      type="button"
                    >
                      {pendingStatus === action.toStatus ? "Atualizando..." : action.label}
                    </button>
                  ))
                ) : (
                  <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4 text-sm text-[var(--muted)]">
                    Nenhuma acao disponivel para este status.
                  </div>
                )}
              </div>

              {feedback ? (
                <div className="mt-4 rounded-[1.2rem] border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/10 px-4 py-4 text-sm text-[var(--brand-green-dark)]">
                  {feedback}
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
