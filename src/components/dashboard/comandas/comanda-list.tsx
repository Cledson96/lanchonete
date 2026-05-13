import {
  canEditComanda,
  humanizeComandaStatus,
  statusTone,
  type ComandaDetail,
} from "@/lib/comanda-ui";
import { formatMoney } from "@/lib/utils";
import { describeComandaProgress, formatElapsed } from "./helpers";

export function ComandaList({
  loading,
  openCommandas,
  closedCommandas,
  selectedId,
  showClosed,
  setShowClosed,
  onOpenComanda,
}: {
  loading: boolean;
  openCommandas: ComandaDetail[];
  closedCommandas: ComandaDetail[];
  selectedId: string | null;
  showClosed: boolean;
  setShowClosed: (showClosed: boolean) => void;
  onOpenComanda: (id: string) => void;
}) {
  const visibleCommandas = showClosed ? closedCommandas : openCommandas;

  return (
    <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-2">
          <button
            className={`text-sm font-bold tracking-tight transition ${
              !showClosed ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => setShowClosed(false)}
            type="button"
          >
            Abertas
          </button>
          <span className="text-[var(--line)]">|</span>
          <button
            className={`text-sm font-bold tracking-tight transition ${
              showClosed ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => setShowClosed(true)}
            type="button"
          >
            Fechadas
          </button>
        </div>
        <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
          {visibleCommandas.length}
        </span>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--muted)]">
            Carregando…
          </div>
        ) : visibleCommandas.length ? (
          visibleCommandas.map((comanda) => {
            const selected = selectedId === comanda.id;
            const active = canEditComanda(comanda.status);
            const entryCount = comanda.entries.reduce((sum, entry) => sum + entry.quantity, 0);
            const progressLabel = describeComandaProgress(comanda);

            return (
              <button
                className={`block w-full overflow-hidden rounded-xl border text-left transition ${
                  selected
                    ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/5 shadow-sm"
                    : active
                      ? "border-[var(--line)] bg-white hover:border-[var(--brand-orange)]/40 hover:shadow-sm"
                      : "border-[var(--line)] bg-[var(--background)] opacity-70 hover:opacity-100"
                }`}
                key={comanda.id}
                onClick={() => onOpenComanda(comanda.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                      {comanda.code.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold leading-tight">
                      {comanda.name || comanda.customerProfile?.fullName || "Sem nome"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--muted)]">
                        {progressLabel}
                      </span>
                      <span className="rounded-full bg-[var(--brand-green)]/12 px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--brand-green-dark)]">
                        {comanda.operationalSummary.readyOrDeliveredUnits}/{comanda.operationalSummary.activeUnits} prontos
                      </span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[0.6rem] font-semibold ${statusTone(comanda.status)}`}>
                    {humanizeComandaStatus(comanda.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--background)]/50 px-3 py-2">
                  <p className="text-[0.7rem] text-[var(--muted)]">
                    {entryCount} {entryCount === 1 ? "item" : "itens"} · {formatElapsed(comanda.updatedAt)}
                  </p>
                  <p className="text-sm font-bold text-[var(--brand-orange-dark)]">{formatMoney(comanda.totalAmount)}</p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-8 text-center text-xs text-[var(--muted)]">
            Nenhuma comanda aberta.<br />Abra a primeira para gerar um QR.
          </div>
        )}
      </div>
    </aside>
  );
}
