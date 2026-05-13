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
import type { OperationalSummary, OrderItemUnitStatus } from "@/lib/order-operations";
import { formatMoney } from "@/lib/utils";
import {
  DashboardOrderDetailSheet,
  type DashboardOrderDetail,
} from "@/components/dashboard/order-detail-sheet";

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
  comanda?: {
    id: string;
    code: string;
    name: string | null;
    notes: string | null;
    totalAmount: number | string;
    entries: Array<{ id: string }>;
    operationalSummary?: OperationalSummary;
  } | null;
  operationalSummary: OperationalSummary;
  items: Array<{
    id: string;
    quantity: number;
    notes: string | null;
    menuItem: { name: string };
    units: Array<{
      id: string;
      sequence: number;
      status: OrderItemUnitStatus;
    }>;
    operationalSummary: OperationalSummary;
    selectedOptions?: Array<{
      quantity: number;
      optionItem: { name: string };
    }>;
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

type KitchenItemCardData = {
  id: string;
  orderId: string;
  itemId: string;
  unitId: string;
  orderCode: string;
  unitStatus: OrderItemUnitStatus;
  channel: OrderChannel;
  type: OrderSummary["type"];
  customerName: string | null;
  createdAt: string;
  comandaLabel: string | null;
  orderNotes: string | null;
  itemQuantity: number;
  unitSequence: number;
  name: string;
  itemNotes: string | null;
  optionLines: string[];
  ingredientLines: string[];
};

type KitchenColumnConfig = ColumnConfig & { status: "novo" | "em_preparo" | "pronto" };

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

function summarizeSelectedOptions(
  selectedOptions?: OrderSummary["items"][number]["selectedOptions"],
) {
  if (!selectedOptions?.length) return [] as string[];

  return selectedOptions.map((option) =>
    option.quantity > 1 ? `${option.quantity}x ${option.optionItem.name}` : option.optionItem.name,
  );
}

function getComandaLabel(order: Pick<OrderSummary, "comanda">) {
  if (!order.comanda) return null;
  return order.comanda.name?.trim() || order.comanda.code.slice(0, 8);
}

function buildKitchenItems(orders: OrderSummary[]) {
  return orders
    .filter((order) => order.status !== "cancelado" && order.status !== "fechado")
    .flatMap((order) =>
      order.items.flatMap((item) =>
        item.units
          .filter((unit) => unit.status === "novo" || unit.status === "em_preparo" || unit.status === "pronto")
          .map((unit) => ({
            id: unit.id,
            orderId: order.id,
            itemId: item.id,
            unitId: unit.id,
            orderCode: order.code,
            unitStatus: unit.status,
            channel: order.channel,
            type: order.type,
            customerName: order.customerName,
            createdAt: order.createdAt,
            comandaLabel: getComandaLabel(order),
            orderNotes: order.notes,
            itemQuantity: item.quantity,
            unitSequence: unit.sequence,
            name: item.menuItem.name,
            itemNotes: item.notes,
            optionLines: summarizeSelectedOptions(item.selectedOptions),
            ingredientLines: summarizeIngredientChanges(item.ingredientCustomizations),
          })),
      ),
    );
}

function describeOrderSummary(summary: OperationalSummary) {
  if (summary.isFullyDelivered) return "Todos entregues";
  if (summary.isFullyReady) return "Todos prontos";
  if (summary.isPartiallyDelivered) return "Entrega parcial";
  if (summary.isPartiallyReady) return "Parcial pronto";
  return "Em andamento";
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
  const visibleItems = order.items.slice(0, 3);
  const hiddenItemsCount = order.items.length - visibleItems.length;
  const comandaLabel = order.comanda?.name?.trim() || (order.comanda ? order.comanda.code.slice(0, 8) : null);
  const progressLabel = describeOrderSummary(order.operationalSummary);

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
          {order.comanda ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-violet-700">
              Comanda {comandaLabel}
            </span>
          ) : null}
          <span className="inline-flex rounded-md bg-[var(--background)] px-1.5 py-0.5 text-[0.65rem] font-semibold text-[var(--muted)]">
            {progressLabel}
          </span>
        </div>

        {/* Itens */}
        <div className="mt-2 space-y-2">
          {visibleItems.length ? (
            visibleItems.map((item) => {
              const optionPreview = summarizeSelectedOptions(item.selectedOptions).slice(0, 2).join(" • ");
              const ingredientPreview = summarizeIngredientChanges(item.ingredientCustomizations).slice(0, 2).join(" • ");

              return (
                <div key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--background)] px-2.5 py-2">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex min-w-8 shrink-0 items-center justify-center rounded-md bg-[var(--brand-orange)]/10 px-1.5 py-1 text-[0.65rem] font-bold text-[var(--brand-orange-dark)]">
                      {item.quantity}x
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-4 text-[var(--foreground)]">{item.menuItem.name}</p>
                      {optionPreview ? (
                        <p className="mt-1 line-clamp-2 text-[0.7rem] leading-4 text-[var(--brand-green-dark)]">+ {optionPreview}</p>
                      ) : null}
                      {ingredientPreview ? (
                        <p className="mt-1 line-clamp-2 text-[0.7rem] leading-4 text-[var(--muted)]">{ingredientPreview}</p>
                      ) : null}
                      {item.notes ? (
                        <p className="mt-1 line-clamp-2 text-[0.7rem] leading-4 text-amber-700">Obs: {item.notes}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs leading-relaxed text-[var(--muted)]">Sem itens</p>
          )}

          {hiddenItemsCount > 0 ? (
            <p className="text-[0.7rem] font-medium text-[var(--muted)]">+{hiddenItemsCount} item(ns) neste pedido</p>
          ) : null}
        </div>

        {/* Rodapé */}
        <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2">
          <div className="text-[0.7rem] text-[var(--muted)]">
            <p>{itemCount} {itemCount === 1 ? "item" : "itens"}</p>
            {order.comanda ? <p>{order.comanda.entries.length} lançamento(s)</p> : null}
            <p>{order.operationalSummary.readyOrDeliveredUnits}/{order.operationalSummary.activeUnits} prontos</p>
          </div>
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

function KitchenItemCard({
  item,
  isOverlay,
  onOpen,
}: {
  item: KitchenItemCardData;
  isOverlay?: boolean;
  onOpen: (orderId: string) => void;
}) {
  const { setNodeRef, attributes, listeners, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled: isOverlay,
  });
  const channel = channelMeta[item.channel];

  return (
    <button
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : { transform: CSS.Translate.toString(transform) }}
      className={`w-full rounded-xl border border-[var(--line)] bg-white p-3 text-left shadow-[0_2px_8px_rgba(45,24,11,0.04)] transition ${isDragging && !isOverlay ? "opacity-40" : ""} ${isOverlay ? "cursor-grabbing rotate-2 shadow-[0_12px_32px_rgba(45,24,11,0.18)] ring-2 ring-[var(--brand-orange)]/40" : "cursor-grab hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(45,24,11,0.08)]"}`}
      onClick={() => onOpen(item.orderId)}
      type="button"
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            <span className="inline-flex rounded-md bg-[var(--background)] px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">
              {item.orderCode.slice(0, 8)}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold ${channel.badge}`}>
              {channel.icon}
              {channel.label}
            </span>
            {item.comandaLabel ? (
              <span className="inline-flex rounded-md bg-violet-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-violet-700">
                Comanda {item.comandaLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[0.75rem] font-medium text-[var(--muted)]">
            {item.customerName || humanize(item.type)}
          </p>
        </div>
        <span className="text-[0.7rem] font-semibold text-[var(--foreground)]">{formatElapsed(item.createdAt)}</span>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <span className="inline-flex min-w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-orange)]/10 px-2 py-1 text-xs font-bold text-[var(--brand-orange-dark)]">
          #{item.unitSequence}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5 text-[var(--foreground)]">{item.name}</p>
          <p className="mt-1 text-[0.72rem] leading-4 text-[var(--muted)]">Unidade {item.unitSequence} de {item.itemQuantity}</p>
          {item.optionLines.length ? (
            <p className="mt-1 text-[0.75rem] leading-4 text-[var(--brand-green-dark)]">+ {item.optionLines.join(" • ")}</p>
          ) : null}
          {item.ingredientLines.length ? (
            <p className="mt-1 text-[0.75rem] leading-4 text-[var(--muted)]">{item.ingredientLines.join(" • ")}</p>
          ) : null}
          {item.itemNotes ? (
            <p className="mt-1 text-[0.75rem] leading-4 text-amber-700">Obs. item: {item.itemNotes}</p>
          ) : null}
          {item.orderNotes ? (
            <p className="mt-1 text-[0.75rem] leading-4 text-amber-700/90">Obs. pedido: {item.orderNotes}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function KitchenKanbanColumn({
  column,
  items,
  loading,
  onOpen,
}: {
  column: KitchenColumnConfig;
  items: KitchenItemCardData[];
  loading: boolean;
  onOpen: (orderId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <article ref={setNodeRef} className={`flex w-[18rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border-t-4 ${column.accent} border-x border-b border-[var(--line)] bg-[var(--surface)] shadow-sm transition-all ${isOver ? "ring-2 ring-[var(--brand-orange)]/50 ring-offset-2 scale-[1.01]" : ""}`}>
      <div className={`flex items-center justify-between gap-2 px-4 py-3 ${column.headerBg}`}>
        <p className="text-sm font-bold tracking-tight">{column.label}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${column.countBg}`}>{items.length}</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ minHeight: "14rem", maxHeight: "calc(100vh - 18rem)" }}>
        {loading && !items.length ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--muted)]">
            Carregando…
          </div>
        ) : items.length ? (
          items.map((item) => <KitchenItemCard key={item.id} item={item} onOpen={onOpen} />)
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
  const [activeKitchenItem, setActiveKitchenItem] = useState<KitchenItemCardData | null>(null);
  const [pendingUnitId, setPendingUnitId] = useState<string | null>(null);
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
    let consecutiveErrors = 0;
    const interval = window.setInterval(() => {
      void refreshOrders(true)
        .then(() => {
          consecutiveErrors = 0;
        })
        .catch(() => {
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            window.clearInterval(interval);
          }
        });
    }, 7000);
    return () => window.clearInterval(interval);
  }, [refreshOrders]);

  const operationalOrders = useMemo(() => orders.filter((order) => order.items.length > 0), [orders]);

  const columns = useMemo(() => {
    return columnsByView[view].map((column) => ({
      ...column,
      orders: operationalOrders
        .filter((order) => order.status === column.status)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }));
  }, [operationalOrders, view]);

  const kitchenColumns = useMemo(() => {
    const items = buildKitchenItems(operationalOrders);

    return (columnsByView.kitchen as KitchenColumnConfig[]).map((column) => ({
      ...column,
      items: items
        .filter((item) => item.unitStatus === column.status)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }));
  }, [operationalOrders]);

  const showOrderBoard = view !== "kitchen";
  const showKitchenBoard = view === "operation" || view === "kitchen";

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

  async function handleUnitTransition(input: {
    orderId: string;
    itemId: string;
    unitId: string;
    toStatus: "em_preparo" | "pronto" | "entregue" | "cancelado";
  }) {
    try {
      setPendingUnitId(input.unitId);
      setDetailError(null);
      setFeedback(null);
      const response = await fetch(`/api/dashboard/orders/${input.orderId}/items/${input.itemId}/units/${input.unitId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStatus: input.toStatus }),
      });
      const payload = await parseJson<{ order: DashboardOrderDetail }>(response);
      setSelectedOrder(payload.order);
      setFeedback(`Item atualizado para ${humanize(input.toStatus)}.`);
      await refreshOrders(false);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Não foi possível atualizar o item.");
    } finally {
      setPendingUnitId(null);
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

  function handleKitchenDragStart(event: DragStartEvent) {
    const items = buildKitchenItems(ordersRef.current);
    const kitchenItem = items.find((item) => item.id === event.active.id);
    if (kitchenItem) setActiveKitchenItem(kitchenItem);
  }

  async function handleKitchenDragEnd(event: DragEndEvent) {
    setActiveKitchenItem(null);
    const { active, over } = event;
    if (!over) return;

    const items = buildKitchenItems(ordersRef.current);
    const current = items.find((item) => item.id === active.id);
    const toStatus = over.id as OrderItemUnitStatus;

    if (!current || current.unitStatus === toStatus) return;
    if (toStatus !== "em_preparo" && toStatus !== "pronto") return;

    await handleUnitTransition({
      orderId: current.orderId,
      itemId: current.itemId,
      unitId: current.unitId,
      toStatus,
    });
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

      {showOrderBoard ? (
        <section className="space-y-3">
          {showKitchenBoard ? (
            <div>
              <p className="text-sm font-semibold tracking-tight text-[var(--foreground)]">Pedidos e comandas</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Visão consolidada do pedido inteiro para acompanhar status, total e contexto da comanda.</p>
            </div>
          ) : null}

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
        </section>
      ) : null}

      {showKitchenBoard ? (
        <section className="space-y-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-[var(--foreground)]">Fila da cozinha por item</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Visão focada no que precisa ser preparado agora. Clique no item para abrir o pedido/comanda completo.</p>
          </div>

          <section className="-mx-4 overflow-x-auto pb-4 lg:mx-0">
            <DndContext onDragStart={handleKitchenDragStart} onDragEnd={handleKitchenDragEnd} onDragCancel={() => setActiveKitchenItem(null)} sensors={sensors}>
              <div className="flex snap-x gap-4 px-4 lg:px-0">
                {kitchenColumns.map((column) => (
                  <KitchenKanbanColumn
                    key={`kitchen-${column.status}`}
                    column={column}
                    items={column.items}
                    loading={loadingList}
                    onOpen={(id) => void openOrder(id)}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeKitchenItem ? <KitchenItemCard item={activeKitchenItem} isOverlay onOpen={() => undefined} /> : null}
              </DragOverlay>
            </DndContext>
          </section>
        </section>
      ) : null}

      <DashboardOrderDetailSheet
        error={detailError}
        feedback={feedback}
        loading={loadingDetail}
        onClose={closeDetail}
        onTransition={handleTransition}
        onUnitTransition={handleUnitTransition}
        order={selectedOrder}
        pendingStatus={pendingStatus}
        pendingUnitId={pendingUnitId}
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
