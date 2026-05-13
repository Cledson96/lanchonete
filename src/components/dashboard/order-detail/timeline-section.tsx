import { Typography } from "@/components/ui/typography";
import { formatDateTime, humanizeStatus } from "./helpers";
import type { DashboardOrderDetail } from "./types";

export function TimelineSection({ order }: { order: DashboardOrderDetail }) {
  if (!(order.statusEvents || []).length) return null;

  return (
    <section>
      <Typography className="mb-2" tone="muted" variant="eyebrow">Histórico</Typography>
      <ol className="relative space-y-3 border-l-2 border-[var(--line)] pl-4">
        {(order.statusEvents || []).map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full border-2 border-[var(--brand-orange)] bg-white" />
            <div className="flex items-baseline justify-between gap-2">
              <Typography variant="title-sm">
                {event.fromStatus ? (
                  <>
                    <span className="text-[var(--muted)]">{humanizeStatus(event.fromStatus)}</span>
                    <span className="mx-1 text-[var(--muted)]">→</span>
                    {humanizeStatus(event.toStatus)}
                  </>
                ) : (
                  humanizeStatus(event.toStatus)
                )}
              </Typography>
              <Typography as="span" className="shrink-0" tone="muted" variant="caption">{formatDateTime(event.createdAt)}</Typography>
            </div>
            {event.note ? <Typography className="mt-0.5 leading-5" tone="muted" variant="caption-sm">{event.note}</Typography> : null}
            {event.changedBy?.email || event.changedBy?.name ? (
              <Typography className="mt-0.5 italic" tone="muted" variant="caption">
                por {event.changedBy.name || event.changedBy.email}
              </Typography>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
