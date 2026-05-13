import { useEffect } from "react";
import { CloseIcon } from "./icons";
import type { DeleteState } from "./types";

export function DeleteDialog({
  deleting,
  onClose,
  onConfirm,
  state,
}: {
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  state: NonNullable<DeleteState>;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleting, onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(45,24,11,0.45)] p-4 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-red-600">Excluir grupo</p>
            <h2 className="mt-0.5 text-lg font-bold leading-tight">{state.name}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {state.optionCount > 0
                ? `${state.optionCount} ${state.optionCount === 1 ? "opção será removida" : "opções serão removidas"} junto.`
                : "Grupo vazio — remoção direta."}
            </p>
          </div>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
            disabled={deleting}
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.7rem] text-amber-800">
          Itens do cardápio vinculados a este grupo podem bloquear a exclusão.
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
            disabled={deleting}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="flex-1 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleting}
            onClick={() => void onConfirm()}
            type="button"
          >
            {deleting ? "Excluindo…" : "Excluir grupo"}
          </button>
        </div>
      </div>
    </div>
  );
}
