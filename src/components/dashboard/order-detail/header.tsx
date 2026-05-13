import { formatTime, humanizeStatus, humanizeType } from "./helpers";
import { CloseIcon } from "./icons";
import { channelStyle, statusStyle } from "./styles";
import type { DashboardOrderDetail } from "./types";

export function OrderDetailHeader({
  order,
  loading,
  onClose,
}: {
  order: DashboardOrderDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
      {loading || !order ? (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--muted)]">Carregando pedido…</p>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Pedido</p>
                <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold ${channelStyle[order.channel].cls}`}>
                  {channelStyle[order.channel].label}
                </span>
              </div>
              <h2 className="mt-0.5 truncate text-xl font-bold tracking-tight">{order.code.slice(0, 8)}</h2>
            </div>
            <button
              aria-label="Fechar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
              onClick={onClose}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[order.status]}`}>
              {humanizeStatus(order.status)}
            </span>
            <span className="text-xs text-[var(--muted)]">•</span>
            <span className="text-xs font-medium text-[var(--muted)]">{humanizeType(order.type)}</span>
            <span className="text-xs text-[var(--muted)]">•</span>
            <span className="text-xs text-[var(--muted)]">{formatTime(order.createdAt)}</span>
          </div>
        </>
      )}
    </header>
  );
}
