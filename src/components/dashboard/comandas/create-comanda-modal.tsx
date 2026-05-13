import type { Dispatch, SetStateAction } from "react";
import { CloseIcon } from "./icons";
import type { CreateModalState } from "./types";

const closedCreateModal: CreateModalState = {
  open: false,
  name: "",
  notes: "",
  error: null,
  loading: false,
};

export function CreateComandaModal({
  createModal,
  setCreateModal,
  onCreate,
}: {
  createModal: CreateModalState;
  setCreateModal: Dispatch<SetStateAction<CreateModalState>>;
  onCreate: () => void;
}) {
  function closeModal() {
    if (!createModal.loading) setCreateModal(closedCreateModal);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(45,24,11,0.4)] p-4 backdrop-blur-[3px]">
      <button aria-label="Fechar" className="absolute inset-0" onClick={closeModal} type="button" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Nova comanda
            </p>
            <h2 className="mt-0.5 text-lg font-bold">Abrir comanda do salão</h2>
          </div>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
            disabled={createModal.loading}
            onClick={closeModal}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Nome do cliente ou mesa
            </span>
            <input
              autoFocus
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand-orange)]"
              onChange={(event) => setCreateModal((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex: Mesa da Julia"
              value={createModal.name}
            />
          </label>

          <label className="block">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Observação (opcional)
            </span>
            <textarea
              className="mt-1 h-20 w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand-orange)]"
              onChange={(event) => setCreateModal((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Aniversariante, mesa do fundo, dividir a conta…"
              value={createModal.notes}
            />
          </label>
        </div>

        {createModal.error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {createModal.error}
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
            disabled={createModal.loading}
            onClick={closeModal}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="flex-1 rounded-full bg-[var(--brand-orange)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={createModal.loading || createModal.name.trim().length < 2}
            onClick={() => void onCreate()}
            type="button"
          >
            {createModal.loading ? "Abrindo…" : "Abrir comanda"}
          </button>
        </div>
      </div>
    </div>
  );
}
