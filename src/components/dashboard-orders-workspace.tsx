"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatMoney } from "@/lib/utils";
import {
  DashboardOrderDetailSheet,
  type DashboardOrderDetail,
} from "@/components/dashboard-order-detail-sheet";

type DashboardOrderView = "operation" | "kitchen" | "dispatch" | "archive";
type OrderStatus = DashboardOrderDetail["status"];
type OrderChannel = DashboardOrderDetail["channel"];

type OrderSummary = {
  id: string;
  code: string;
  channel: OrderChannel;
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
    menuItem: { name: string };
    ingredientCustomizations?: Array<{
      quantity: number;
      ingredient: { name: string };
    }>;
  }>;
};

type Props = {
  view: DashboardOrderView;
  title: string;
  description: string;
};

type ColumnConfig = {
  status: OrderStatus;
  label: string;
  accent: string;
  headerBg: string;
  countBg: string;
};

const columnsByView: Record<DashboardOrderView, ColumnConfig[]> = {
  operation: [
    { status: "novo", label: "Novos", accent: "border-t-amber-400", headerBg: "bg-amber-50", countBg: "bg-amber-100 text-amber-700" },
    { status: "em_preparo", label: "Em preparo", accent: "border-t-[var(--brand-orange)]", headerBg: "bg-[var(--brand-orange)]/5", countBg: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]" },
    { status: "pronto", label: "Prontos", accent: "border-t-[var(--brand-green)]", headerBg: "bg-[var(--brand-green)]/5", countBg: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]" },
    { status: "saiu_para_entrega", label: "Saindo", accent: "border-t-sky-400", headerBg: "bg-sky-50", countBg: "bg-sky-100 text-sky-700" },
  ],
  kitchen: [
    { status: "novo", label: "Novos", accent: "border-t-amber-400", headerBg: "bg-amber-50", countBg: "bg-amber-100 text-amber-700" },
    { status: "em_preparo", label: "Em preparo", accent: "border-t-[var(--brand-orange)]", headerBg: "bg-[var(--brand-orange)]/5", countBg: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]" },
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

const channelMeta: Record<OrderChannel, { label: string; stripe: string; badge: string; icon: React.ReactNode }> = {
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

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatElapsed(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}min` : `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function summarizeIngredientChanges(
  ingredientCustomizations?: OrderSummary["items"][number]["ingredientCustomizations"],
) {
  if (!ingredientCustomizations?.length) return [] as string[];
  return ingredientCustomizations
    .filter((ing) => ing.quantity !== 1)
    .map((ing) => (ing.quantity === 0 ? `sem ${ing.ingredient.name}` : `${ing.quantity}x ${ing.ingredient.name}`));
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Não foi possível concluir a ação.");
  }
  return payload;
}

/* ─────────────────── Card ─────────────────── */

function OrderCard({
  order,
  isOverlay,
  onOpen,
}: {
  order: OrderSummary;
  isOverlay?: boolean;
  onOpen?: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
    disabled: isOverlay,
  });

  const channel = channelMeta[order.channel];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const hasNotes = Boolean(order.notes) || order.items.some((item) => Boolean(item.notes));
  const itemsPreview = order.items
    .slice(0, 2)
    .map((item) => `${item.quantity}× ${item.menuItem.name}`)
    .join(" • ");
  const ingredientPreview = order.items
    .flatMap((item) => summarizeIngredientChanges(item.ingredientCustomizations))
    .slice(0, 3)
    .join(" • ");

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : { transform: CSS.Translate.toString(transform) }}
      className={`relative overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_2px_8px_rgba(45,24,11,0.04)] transition ${
        isDragging && !isOverlay ? "opacity-40" : ""
      } ${isOverlay ? "cursor-grabbing rotate-2 shadow-[0_12px_32px_rgba(45,24,11,0.18)] ring-2 ring-[var(--brand-orange)]/40" : "cursor-grab hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(45,24,11,0.08)]"}`}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      onClick={(e) => {
        if (isOverlay) return;
        if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
        onOpen?.();
      }}
    >
      {/* Faixa lateral do canal */}
      <div className={`absolute left-0 top-0 h-full w-1 ${channel.stripe}`} aria-hidden="true" />

      <div className="pl-4 pr-3 py-3">
        {/* Topo */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--background)] px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">
              {order.code.slice(0, 8)}
            </span>
            <p className="mt-1.5 truncate text-sm font-semibold leading-tight">
              {order.customerName || order.customerPhone || "Cliente"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.7rem] font-semibold text-[var(--foreground)]">{formatElapsed(order.createdAt)}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold ${channel.badge}`}>
            {channel.icon}
            {channel.label}
          </span>
          <span className="inline-flex rounded-md bg-[var(--background)] px-1.5 py-0.5 text-[0.65rem] font-semibold capitalize text-[var(--muted)]">
            {humanize(order.type)}
          </span>
          {hasNotes ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              obs
            </span>
          ) : null}
        </div>

        {/* Itens */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
          {itemsPreview || "Sem itens"}
          {order.items.length > 2 ? ` • +${order.items.length - 2}` : ""}
        </p>
        {ingredientPreview ? (
          <p className="mt-1 line-clamp-1 text-[0.7rem] text-[var(--muted)]">{ingredientPreview}</p>
        ) : null}

        {/* Rodapé */}
        <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2">
          <span className="text-[0.7rem] text-[var(--muted)]">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
          <span className="text-sm font-bold text-[var(--foreground)]">
            {formatMoney(toNumber(order.totalAmount))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Coluna ─────────────────── */

function KanbanColumn({
  column,
  orders,
  loading,
  allowDrop,
  onOpen,
}: {
  column: ColumnConfig;
  orders: OrderSummary[];
  loading: boolean;
  allowDrop: boolean;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status, disabled: !allowDrop });

  return (
    <article
      ref={setNodeRef}
      className={`flex w-[18rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border-t-4 ${column.accent} border-x border-b border-[var(--line)] bg-[var(--surface)] shadow-sm transition-all ${
        isOver ? "ring-2 ring-[var(--brand-orange)]/50 ring-offset-2 scale-[1.01]" : ""
      }`}
    >
      {/* Header da coluna */}
      <div className={`flex items-center justify-between gap-2 px-4 py-3 ${column.headerBg}`}>
        <p className="text-sm font-bold tracking-tight">{column.label}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${column.countBg}`}>
          {orders.length}
        </span>
      </div>

      {/* Lista de cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ minHeight: "14rem", maxHeight: "calc(100vh - 18rem)" }}>
        {loading && !orders.length ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--muted)]">
            Carregando…
          </div>
        ) : orders.length ? (
          orders.map((order) => <OrderCard key={order.id} order={order} onOpen={() => onOpen(order.id)} />)
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--muted)]">
            {isOver ? "Solte aqui" : "Vazio"}
          </div>
        )}
      </div>
    </article>
  );
}

/* ─────────────────── Workspace ─────────────────── */

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
  const [channelFilter, setChannelFilter] = useState<"all" | OrderChannel>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | OrderSummary["type"]>("all");
  const [activeDrag, setActiveDrag] = useState<OrderSummary | null>(null);
  const ordersRef = useRef<OrderSummary[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const refreshOrders = useCallback(
    async (keepDetail = true) => {
      try {
        setListError(null);
        const params = new URLSearchParams({ view });
        if (channelFilter !== "all") params.set("channel", channelFilter);
        if (typeFilter !== "all") params.set("type", typeFilter);

        const response = await fetch(`/api/dashboard/orders?${params.toString()}`, { cache: "no-store" });
        const payload = await parseJson<{ orders: OrderSummary[] }>(response);
        setOrders(payload.orders);
        ordersRef.current = payload.orders;

        if (keepDetail && selectedOrderId) {
          const detailResponse = await fetch(`/api/dashboard/orders/${selectedOrderId}`, { cache: "no-store" });
          const detailPayload = await parseJson<{ order: DashboardOrderDetail }>(detailResponse);
          setSelectedOrder(detailPayload.order);
        }
      } catch (error) {
        setListError(error instanceof Error ? error.message : "Não foi possível carregar os pedidos.");
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
      setDetailError(error instanceof Error ? error.message : "Não foi possível carregar o pedido.");
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
    return columnsByView[view].map((column) => ({
      ...column,
      orders: orders
        .filter((order) => order.status === column.status)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }));
  }, [orders, view]);

  async function handleTransition(toStatus: OrderStatus) {
    if (!selectedOrder) return;
    try {
      const currentOrderId = selectedOrder.id;
      setPendingStatus(toStatus);
      setDetailError(null);
      setFeedback(null);
      const response = await fetch(`/api/dashboard/orders/${currentOrderId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      const payload = await parseJson<{ order: { code: string; status: OrderStatus } }>(response);
      const detailResponse = await fetch(`/api/dashboard/orders/${currentOrderId}`, { cache: "no-store" });
      const detailPayload = await parseJson<{ order: DashboardOrderDetail }>(detailResponse);
      setSelectedOrder(detailPayload.order);
      setFeedback(`Pedido ${payload.order.code} atualizado para ${humanize(payload.order.status)}.`);
      await refreshOrders(false);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
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

  function handleDragStart(event: DragStartEvent) {
    const order = ordersRef.current.find((o) => o.id === event.active.id);
    if (order) setActiveDrag(order);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const toStatus = over.id as OrderStatus;
    const current = ordersRef.current.find((o) => o.id === orderId);
    if (!current || current.status === toStatus) return;

    // Update otimista
    const prev = ordersRef.current;
    const next = prev.map((o) => (o.id === orderId ? { ...o, status: toStatus } : o));
    ordersRef.current = next;
    setOrders(next);
    setFeedback(null);
    setListError(null);

    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      const payload = await parseJson<{ order: { code: string; status: OrderStatus } }>(response);
      setFeedback(`Pedido ${payload.order.code} → ${humanize(payload.order.status)}`);
      await refreshOrders(false);
    } catch (error) {
      // Reverte
      ordersRef.current = prev;
      setOrders(prev);
      setListError(error instanceof Error ? error.message : "Não foi possível mover o pedido.");
    }
  }

  return (
    <main className="space-y-4 text-[var(--foreground)]">

      {/* ─── Header compacto ─── */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow text-[var(--muted)]">Operação em tempo real</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)]">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            label="Canal"
            value={channelFilter}
            onChange={(v) => setChannelFilter(v as typeof channelFilter)}
            options={[
              { value: "all", label: "Todos" },
              { value: "web", label: "Web" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "local", label: "Balcão" },
            ]}
          />
          <FilterPill
            label="Tipo"
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as typeof typeFilter)}
            options={[
              { value: "all", label: "Todos" },
              { value: "delivery", label: "Delivery" },
              { value: "retirada", label: "Retirada" },
              { value: "local", label: "Local" },
            ]}
          />
          <button
            className="rounded-full bg-[var(--brand-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
            onClick={() => { setLoadingList(true); void refreshOrders(true); }}
            type="button"
          >
            Atualizar
          </button>
        </div>
      </section>

      {feedback ? (
        <div className="rounded-xl border border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 px-4 py-2 text-xs font-medium text-[var(--brand-green-dark)]">
          {feedback}
        </div>
      ) : null}
      {listError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          {listError}
        </div>
      ) : null}

      {/* ─── Kanban com scroll horizontal + DnD ─── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        <section className="-mx-4 overflow-x-auto pb-4 lg:mx-0">
          <div className="flex snap-x gap-4 px-4 lg:px-0">
            {columns.map((column) => (
              <KanbanColumn
                key={column.status}
                column={column}
                orders={column.orders}
                loading={loadingList}
                allowDrop={view !== "archive"}
                onOpen={(id) => void openOrder(id)}
              />
            ))}
          </div>
        </section>

        <DragOverlay>
          {activeDrag ? <OrderCard order={activeDrag} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

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

/* ─────────────────── Filter Pill ─────────────────── */

function FilterPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</span>
      <select
        className="bg-transparent text-sm font-medium text-[var(--foreground)] outline-none"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
