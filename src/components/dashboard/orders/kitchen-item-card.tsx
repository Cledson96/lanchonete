import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { channelMeta } from "./config";
import { formatElapsed, humanize } from "./helpers";
import type { KitchenItemCardData } from "./types";

export function KitchenItemCard({
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
