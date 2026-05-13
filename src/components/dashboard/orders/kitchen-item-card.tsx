import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
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
            <Badge className="px-1.5 py-0.5 uppercase tracking-wider" shape="square">
              {item.orderCode.slice(0, 8)}
            </Badge>
            <Badge className={`items-center gap-1 px-1.5 py-0.5 ${channel.badge}`} shape="square">
              {channel.icon}
              {channel.label}
            </Badge>
            {item.comandaLabel ? (
              <Badge className="px-1.5 py-0.5" shape="square" tone="violet">
                Comanda {item.comandaLabel}
              </Badge>
            ) : null}
          </div>
          <Typography className="mt-1" tone="muted" variant="caption">
            {item.customerName || humanize(item.type)}
          </Typography>
        </div>
        <Typography as="span" variant="caption">{formatElapsed(item.createdAt)}</Typography>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <span className="inline-flex min-w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-orange)]/10 px-2 py-1 text-xs font-bold text-[var(--brand-orange-dark)]">
          #{item.unitSequence}
        </span>
        <div className="min-w-0 flex-1">
          <Typography className="leading-5" variant="body-sm">{item.name}</Typography>
          <Typography className="mt-1 leading-4" tone="muted" variant="caption">Unidade {item.unitSequence} de {item.itemQuantity}</Typography>
          {item.optionLines.length ? (
            <Typography className="mt-1 leading-4" tone="green" variant="caption">+ {item.optionLines.join(" • ")}</Typography>
          ) : null}
          {item.ingredientLines.length ? (
            <Typography className="mt-1 leading-4" tone="muted" variant="caption">{item.ingredientLines.join(" • ")}</Typography>
          ) : null}
          {item.itemNotes ? (
            <Typography className="mt-1 leading-4" tone="amber" variant="caption">Obs. item: {item.itemNotes}</Typography>
          ) : null}
          {item.orderNotes ? (
            <Typography className="mt-1 leading-4" tone="amber" variant="caption">Obs. pedido: {item.orderNotes}</Typography>
          ) : null}
        </div>
      </div>
    </button>
  );
}
