import { ComandaEntryList } from "@/components/comanda/entry-list";
import {
  humanizeComandaStatus,
  humanizePaymentMethod,
  statusTone,
  type ComandaDetail,
} from "@/lib/comanda-ui";
import { formatMoney } from "@/lib/utils";
import { describeComandaProgress, formatDate } from "./helpers";
import { PlusIcon, QrIcon } from "./icons";

export function ComandaDetailPanel({
  detailLoading,
  selectedComanda,
  detailError,
  canEdit,
  onOpenQr,
  onOpenClose,
  onOpenAddItem,
}: {
  detailLoading: boolean;
  selectedComanda: ComandaDetail | null;
  detailError: string | null;
  canEdit: boolean;
  onOpenQr: () => void;
  onOpenClose: () => void;
  onOpenAddItem: () => void;
}) {
  if (detailLoading) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--muted)] shadow-sm">
          Carregando detalhe…
        </div>
      </section>
    );
  }

  if (!selectedComanda) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center text-sm text-[var(--muted)] shadow-sm">
          Selecione uma comanda na fila ou abra uma nova para começar.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                {selectedComanda.code.slice(0, 8)}
              </p>
              <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${statusTone(selectedComanda.status)}`}>
                {humanizeComandaStatus(selectedComanda.status)}
              </span>
            </div>
            <h2 className="mt-1 truncate text-xl font-bold tracking-tight">
              {selectedComanda.name || selectedComanda.customerProfile?.fullName || "Sem nome"}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Aberta em {formatDate(selectedComanda.createdAt)}
              {selectedComanda.openedBy?.email ? ` · por ${selectedComanda.openedBy.email}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/5"
              onClick={onOpenQr}
              type="button"
            >
              <QrIcon />
              QR da mesa
            </button>
            {canEdit ? (
              <button
                className="rounded-full bg-[var(--brand-green)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-green-dark)]"
                onClick={onOpenClose}
                type="button"
              >
                Fechar comanda
              </button>
            ) : (
              <span className="rounded-full bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                Encerrada · {humanizePaymentMethod(selectedComanda.paymentMethod)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
          <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--muted)]">
            {describeComandaProgress(selectedComanda)}
          </span>
          <span className="rounded-full bg-[var(--brand-green)]/12 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--brand-green-dark)]">
            {selectedComanda.operationalSummary.readyOrDeliveredUnits}/{selectedComanda.operationalSummary.activeUnits} prontos
          </span>
          {selectedComanda.operationalSummary.deliveredUnits > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-700">
              {selectedComanda.operationalSummary.deliveredUnits} entregue(s)
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-4">
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Subtotal</p>
            <p className="mt-0.5 text-sm font-semibold">{formatMoney(selectedComanda.subtotalAmount)}</p>
          </div>
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Desconto</p>
            <p className="mt-0.5 text-sm font-semibold">{formatMoney(selectedComanda.discountAmount)}</p>
          </div>
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Total</p>
            <p className="mt-0.5 text-lg font-bold text-[var(--brand-orange-dark)]">
              {formatMoney(selectedComanda.totalAmount)}
            </p>
          </div>
        </div>

        {selectedComanda.notes ? (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span className="font-bold">Obs: </span>
            {selectedComanda.notes}
          </div>
        ) : null}
      </section>

      {detailError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{detailError}</div>
      ) : null}

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold tracking-tight">Itens lançados</p>
            <span className="rounded-full bg-[var(--brand-green)]/12 px-2 py-0.5 text-[0.65rem] font-bold text-[var(--brand-green-dark)]">
              {selectedComanda.entries.reduce((sum, entry) => sum + entry.quantity, 0)} itens
            </span>
          </div>
          {canEdit ? (
            <button
              className="flex items-center gap-1.5 rounded-full bg-[var(--brand-orange)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
              onClick={onOpenAddItem}
              type="button"
            >
              <PlusIcon />
              Adicionar item
            </button>
          ) : null}
        </div>
        <ComandaEntryList
          emptyLabel='Nenhum item lançado. Clique em "Adicionar item" para começar.'
          entries={selectedComanda.entries}
        />
      </section>
    </section>
  );
}
