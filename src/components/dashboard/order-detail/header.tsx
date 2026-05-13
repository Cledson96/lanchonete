import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
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
          <IconButton label="Fechar" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Pedido</p>
                <Badge className={channelStyle[order.channel].cls} shape="square">
                  {channelStyle[order.channel].label}
                </Badge>
              </div>
              <h2 className="mt-0.5 truncate text-xl font-bold tracking-tight">{order.code.slice(0, 8)}</h2>
            </div>
            <IconButton label="Fechar" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Badge className={`border text-xs ${statusStyle[order.status]}`}>
              {humanizeStatus(order.status)}
            </Badge>
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
