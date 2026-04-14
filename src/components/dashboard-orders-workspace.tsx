"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/utils";
import {
  DashboardOrderDetailSheet,
  type DashboardOrderDetail,
} from "@/components/dashboard-order-detail-sheet";

type DashboardOrderView = "operation" | "kitchen" | "dispatch" | "archive";

type OrderStatus = DashboardOrderDetail["status"];

type OrderSummary = {
  id: string;
  code: string;
  channel: DashboardOrderDetail["channel"];
  type: DashboardOrderDetail["type"];
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  totalAmount: number | string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    notes: string | null;
    menuItem: {
      name: string;
    };
  }>;
};

type Props = {
  view: DashboardOrderView;
  title: string;
  description: string;
};

type ColumnConfig = {
  statuses: OrderStatus[];
  label: string;
  tone: string;
};

const columnsByView: Record<DashboardOrderView, ColumnConfig[]> = {
  operation: [
    { statuses: ["novo"], label: "Novos", tone: "bg-amber-50 text-amber-700 border-amber-200" },
    { statuses: ["em_preparo"], label: "Em preparo", tone: "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)] border-[var(--brand-orange)]/20" },
    { statuses: ["pronto"], label: "Prontos", tone: "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)] border-[var(--brand-green)]/20" },
    { statuses: ["saiu_para_entrega"], label: "Saindo", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  ],
  kitchen: [
    { statuses: ["novo"], label: "Novos", tone: "bg-amber-50 text-amber-700 border-amber-200" },
    { statuses: ["em_preparo"], label: "Em preparo", tone: "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)] border-[var(--brand-green)]/20" },
  ],
  dispatch: [
    { statuses: ["pronto"], label: "Prontos", tone: "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)] border-[var(--brand-green)]/20" },
    { statuses: ["saiu_para_entrega"], label: "Saindo", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  ],
  archive: [
    { statuses: ["entregue"], label: "Entregues", tone: "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)] border-[var(--brand-green)]/20" },
    { statuses: ["fechado"], label: "Fechados", tone: "bg-[var(--background-strong)] text-[var(--foreground)] border-[var(--line)]" },
    { statuses: ["cancelado"], label: "Cancelados", tone: "bg-red-50 text-red-700 border-red-200" },
  ],
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatElapsed(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) {
    return "agora";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatCreatedAt(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Nao foi possivel concluir a acao.");
  }

  return payload;
}

export function DashboardOrdersWorkspace({ view, title, description }: Props) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrderDetail | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<"all" | OrderSummary["channel"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | OrderSummary["type"]>("all");

  const refreshOrders = useCallback(
    async (keepDetail = true) => {
      try {
        setListError(null);
        const params = new URLSearchParams({ view });

        if (channelFilter !== "all") {
          params.set("channel", channelFilter);
        }

        if (typeFilter !== "all") {
          params.set("type", typeFilter);
        }

        const response = await fetch(`/api/dashboard/orders?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = await parseJson<{ orders: OrderSummary[] }>(response);
        setOrders(payload.orders);

        if (keepDetail && selectedOrderId) {
          const detailResponse = await fetch(`/api/dashboard/orders/${selectedOrderId}`, {
            cache: "no-store",
          });
          const detailPayload = await parseJson<{ order: DashboardOrderDetail }>(detailResponse);
          setSelectedOrder(detailPayload.order);
        }
      } catch (error) {
        setListError(error instanceof Error ? error.message : "Nao foi possivel carregar os pedidos.");
      } finally {
        setLoadingList(false);
      }
    },
    [channelFilter, selectedOrderId, typeFilter, view],
  );

  const openOrder = useCallback(async (orderId: string) => {
    try {
      setSelectedOrderId(orderId);
      setLoadingDetail(true);
      setDetailError(null);
      setFeedback(null);
      const response = await fetch(`/api/dashboard/orders/${orderId}`, { cache: "no-store" });
      const payload = await parseJson<{ order: DashboardOrderDetail }>(response);
      setSelectedOrder(payload.order);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Nao foi possivel carregar o pedido.");
      setSelectedOrder(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    setLoadingList(true);
    void refreshOrders(false);
  }, [refreshOrders]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshOrders(true).catch(() => undefined);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [refreshOrders]);

  const columns = useMemo(() => {
    const currentColumns = columnsByView[view];

    return currentColumns.map((column) => ({
      ...column,
      orders: orders
        .filter((order) => column.statuses.includes(order.status))
        .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
    }));
  }, [orders, view]);

  async function handleTransition(toStatus: OrderStatus) {
    if (!selectedOrder) {
      return;
    }

    try {
      const currentOrderId = selectedOrder.id;
      setPendingStatus(toStatus);
      setDetailError(null);
      setFeedback(null);
      const response = await fetch(`/api/dashboard/orders/${currentOrderId}/status`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ toStatus }),
      });
      const payload = await parseJson<{
        order: {
          code: string;
          status: OrderStatus;
        };
      }>(response);
      const detailResponse = await fetch(`/api/dashboard/orders/${currentOrderId}`, {
        cache: "no-store",
      });
      const detailPayload = await parseJson<{ order: DashboardOrderDetail }>(detailResponse);
      setSelectedOrder(detailPayload.order);
      setFeedback(`Pedido ${payload.order.code} atualizado para ${humanize(payload.order.status)}.`);
      await refreshOrders(false);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Nao foi possivel atualizar o status.");
    } finally {
      setPendingStatus(null);
    }
  }

  function closeDetail() {
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setDetailError(null);
    setFeedback(null);
  }

  return (
    <main className="space-y-6 text-[var(--foreground)]">
      <section className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm transition hover:border-[var(--brand-orange)]/30 hover:shadow-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow mb-3 text-[var(--muted)]">Operacao em tempo real</p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Canal
              <select
                className="rounded-full border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-sm font-medium normal-case tracking-normal text-[var(--foreground)]"
                onChange={(event) => setChannelFilter(event.target.value as typeof channelFilter)}
                value={channelFilter}
              >
                <option value="all">Todos</option>
                <option value="web">Web</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="local">Local</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Tipo
              <select
                className="rounded-full border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-sm font-medium normal-case tracking-normal text-[var(--foreground)]"
                onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
                value={typeFilter}
              >
                <option value="all">Todos</option>
                <option value="delivery">Delivery</option>
                <option value="retirada">Retirada</option>
                <option value="local">Local</option>
              </select>
            </label>
            <button
              className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
              onClick={() => {
                setLoadingList(true);
                void refreshOrders(true);
              }}
              type="button"
            >
              Atualizar
            </button>
          </div>
        </div>
      </section>

      {listError ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {listError}
        </div>
      ) : null}

      <section className={`grid gap-4 ${columns.length <= 2 ? "xl:grid-cols-2" : columns.length === 3 ? "xl:grid-cols-3" : columns.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-5 xl:gap-3"}`}>
        {columns.map((column) => (
          <article key={column.statuses.join("-")} className="panel min-h-[22rem] rounded-[1.8rem] bg-[var(--surface)] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-1 pb-4">
              <div>
                <p className="text-lg font-semibold tracking-tight">{column.label}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{column.orders.length} pedidos</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${column.tone}`}>
                {column.statuses.length > 1 ? humanize(column.label) : humanize(column.statuses[0])}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {loadingList && !orders.length ? (
                <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-6 text-sm text-[var(--muted)]">
                  Carregando fila...
                </div>
              ) : column.orders.length ? (
                column.orders.map((order) => {
                  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  const hasNotes = Boolean(order.notes) || order.items.some((item) => Boolean(item.notes));
                  const itemsPreview = order.items
                    .slice(0, 2)
                    .map((item) => `${item.quantity}x ${item.menuItem.name}`)
                    .join(" • ");

                  return (
                    <button
                      key={order.id}
                      className="w-full rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-left shadow-[0_8px_24px_rgba(45,24,11,0.04)] transition hover:-translate-y-0.5 hover:border-[var(--brand-orange)]/35 hover:shadow-[0_14px_30px_rgba(242,122,34,0.12)]"
                      onClick={() => void openOrder(order.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-flex rounded-full bg-[var(--brand-orange)]/10 px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-orange-dark)]">
                            {order.code.slice(0, 8)}
                          </span>
                          <p className="mt-3 text-lg font-semibold">
                            {order.customerName || order.customerPhone || "Cliente"}
                          </p>
                        </div>
                        <div className="text-right text-xs text-[var(--muted)]">
                          <p>{formatElapsed(order.createdAt)}</p>
                          <p className="mt-1">{formatCreatedAt(order.createdAt)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold capitalize text-[var(--muted)]">
                          {order.channel}
                        </span>
                        <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold capitalize text-[var(--muted)]">
                          {humanize(order.type)}
                        </span>
                        {hasNotes ? (
                          <span className="rounded-full bg-[var(--brand-orange)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-orange-dark)]">
                            Com observacao
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                        {itemsPreview || "Sem itens detalhados"}
                        {order.items.length > 2 ? ` • +${order.items.length - 2} itens` : ""}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
                        <span className="text-sm text-[var(--muted)]">{itemCount} itens</span>
                        <span className="text-lg font-semibold text-[var(--foreground)]">
                          {formatMoney(toNumber(order.totalAmount))}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-8 text-sm text-[var(--muted)]">
                  Nenhum pedido nesta etapa agora.
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <DashboardOrderDetailSheet
        error={detailError}
        feedback={feedback}
        loading={loadingDetail}
        onClose={closeDetail}
        onTransition={handleTransition}
        order={selectedOrder}
        pendingStatus={pendingStatus}
      />
    </main>
  );
}
