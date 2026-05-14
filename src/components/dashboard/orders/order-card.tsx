import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
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
  draggable = true,
  onOpen,
}: {
  order: OrderSummary;
  isOverlay?: boolean;
  draggable?: boolean;
  onOpen?: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
    disabled: isOverlay || !draggable,
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
      } ${isOverlay ? "cursor-grabbing rotate-2 shadow-[0_12px_32px_rgba(45,24,11,0.18)] ring-2 ring-[var(--brand-orange)]/40" : draggable ? "cursor-grab hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(45,24,11,0.08)]" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(45,24,11,0.08)]"}`}
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
            <Badge className="items-center gap-1 px-1.5 py-0.5 uppercase tracking-wider" shape="square">
              {order.code.slice(0, 8)}
            </Badge>
            <Typography className="mt-1.5 truncate leading-tight" variant="body-sm">
              {order.customerName || order.customerPhone || "Cliente"}
            </Typography>
          </div>
          <div className="shrink-0 text-right">
            <Typography tone="default" variant="caption">{formatElapsed(order.createdAt)}</Typography>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Badge className={`items-center gap-1 px-1.5 py-0.5 ${channel.badge}`} shape="square">
            {channel.icon}
            {channel.label}
          </Badge>
          <Badge className="px-1.5 py-0.5 capitalize" shape="square">
            {humanize(order.type)}
          </Badge>
          {hasNotes ? (
            <Badge className="items-center gap-1 px-1.5 py-0.5" shape="square" tone="warning">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              obs
            </Badge>
          ) : null}
          {order.comanda ? (
            <Badge className="items-center gap-1 px-1.5 py-0.5" shape="square" tone="violet">
              Comanda {comandaLabel}
            </Badge>
          ) : null}
          <Badge className="px-1.5 py-0.5" shape="square">
            {progressLabel}
          </Badge>
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
                      <Typography className="leading-4" variant="caption">{item.menuItem.name}</Typography>
                      {optionPreview ? (
                        <Typography className="mt-1 line-clamp-2 leading-4" tone="green" variant="caption">+ {optionPreview}</Typography>
                      ) : null}
                      {ingredientPreview ? (
                        <Typography className="mt-1 line-clamp-2 leading-4" tone="muted" variant="caption">{ingredientPreview}</Typography>
                      ) : null}
                      {item.notes ? (
                        <Typography className="mt-1 line-clamp-2 leading-4" tone="amber" variant="caption">Obs: {item.notes}</Typography>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Typography tone="muted" variant="caption">Sem itens</Typography>
          )}

          {hiddenItemsCount > 0 ? (
            <Typography tone="muted" variant="caption">+{hiddenItemsCount} item(ns) neste pedido</Typography>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2">
          <div>
            <Typography tone="muted" variant="caption">{itemCount} {itemCount === 1 ? "item" : "itens"}</Typography>
            {order.comanda ? <Typography tone="muted" variant="caption">{order.comanda.entries.length} lançamento(s)</Typography> : null}
            <Typography tone="muted" variant="caption">{order.operationalSummary.readyOrDeliveredUnits}/{order.operationalSummary.activeUnits} prontos</Typography>
          </div>
          <Typography as="span" variant="body-sm">
            {formatMoney(toNumber(order.totalAmount))}
          </Typography>
        </div>
      </div>
    </div>
  );
}
