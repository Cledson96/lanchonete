import { formatDateTime, humanizeStatus } from "./helpers";
import type { DashboardOrderDetail } from "./types";

export function TimelineSection({ order }: { order: DashboardOrderDetail }) {
  if (!(order.statusEvents || []).length) return null;

  return (
    <section>
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Histórico</p>
      <ol className="relative space-y-3 border-l-2 border-[var(--line)] pl-4">
        {(order.statusEvents || []).map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full border-2 border-[var(--brand-orange)] bg-white" />
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">
                {event.fromStatus ? (
                  <>
                    <span className="text-[var(--muted)]">{humanizeStatus(event.fromStatus)}</span>
                    <span className="mx-1 text-[var(--muted)]">→</span>
                    {humanizeStatus(event.toStatus)}
                  </>
                ) : (
                  humanizeStatus(event.toStatus)
                )}
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
  );
}
