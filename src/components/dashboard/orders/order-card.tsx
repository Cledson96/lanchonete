import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatMoney } from "@/lib/utils";
import { channelMeta } from "./config";
import {
  describeOrderSummary,
  formatElapsed,
  humanize,
  summarizeIngredientChanges,
  summarizeSelectedOptions,
  toNumber,
} from "./helpers";
import type { OrderSummary } from "./types";

export function OrderCard({
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
      <div className={`absolute left-0 top-0 h-full w-1 ${channel.stripe}`} aria-hidden="true" />

      <div className="pl-4 pr-3 py-3">
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
