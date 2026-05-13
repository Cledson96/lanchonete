import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
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
          <Button
            className={`px-0 py-0 ${
              !showClosed ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => setShowClosed(false)}
            variant="unstyled"
          >
            Abertas
          </Button>
          <Typography as="span" className="text-[var(--line)]" variant="body-sm">|</Typography>
          <Button
            className={`px-0 py-0 ${
              showClosed ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => setShowClosed(true)}
            variant="unstyled"
          >
            Fechadas
          </Button>
        </div>
        <Badge className="px-2 py-0.5 text-xs">
          {visibleCommandas.length}
        </Badge>
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
                    <Typography tone="muted" variant="eyebrow">
                      {comanda.code.slice(0, 8)}
                    </Typography>
                    <Typography className="mt-0.5 truncate" variant="title-sm">
                      {comanda.name || comanda.customerProfile?.fullName || "Sem nome"}
                    </Typography>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge className="px-2 py-0.5 text-[0.65rem]">
                        {progressLabel}
                      </Badge>
                      <Badge className="px-2 py-0.5 text-[0.65rem]" tone="success">
                        {comanda.operationalSummary.readyOrDeliveredUnits}/{comanda.operationalSummary.activeUnits} prontos
                      </Badge>
                    </div>
                  </div>
                  <Badge className={`shrink-0 border px-1.5 py-0.5 text-[0.6rem] ${statusTone(comanda.status)}`}>
                    {humanizeComandaStatus(comanda.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--background)]/50 px-3 py-2">
                  <Typography tone="muted" variant="caption">
                    {entryCount} {entryCount === 1 ? "item" : "itens"} · {formatElapsed(comanda.updatedAt)}
                  </Typography>
                  <Typography tone="orange" variant="title-sm">{formatMoney(comanda.totalAmount)}</Typography>
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
