import { useEffect } from "react";
import { Field } from "./form-controls";
import { CloseIcon } from "./icons";
import type { CategorySummary, DeleteCategoryState } from "./types";

export function DeleteCategoryDialog({
  categoryList,
  deleting,
  onClose,
  onConfirm,
  onSetState,
  state,
}: {
  categoryList: CategorySummary[];
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onSetState: React.Dispatch<React.SetStateAction<DeleteCategoryState>>;
  state: NonNullable<DeleteCategoryState>;
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
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-red-600">Excluir categoria</p>
            <h2 className="mt-0.5 text-lg font-bold leading-tight">{state.name}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {state.itemCount > 0
                ? `Essa categoria tem ${state.itemCount} ${state.itemCount === 1 ? "item" : "itens"}. Escolha o destino antes de excluir.`
                : "Categoria vazia — pode ser excluída diretamente."}
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

        {state.itemCount > 0 ? (
          <div className="mt-4 space-y-2">
            <button
              className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                state.strategy === "move_items"
                  ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/5"
                  : "border-[var(--line)] bg-white hover:border-[var(--brand-orange)]/40"
              }`}
              onClick={() => onSetState((c) => (c ? { ...c, strategy: "move_items" } : c))}
              type="button"
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  state.strategy === "move_items" ? "border-[var(--brand-orange)]" : "border-[var(--line)]"
                }`}
              >
                {state.strategy === "move_items" ? (
                  <span className="h-2 w-2 rounded-full bg-[var(--brand-orange)]" />
                ) : null}
              </span>
              <span>
                <span className="block font-semibold text-[var(--foreground)]">Mover itens para outra</span>
                <span className="block text-[0.65rem] text-[var(--muted)]">Preserva os itens, só troca a categoria.</span>
              </span>
            </button>

            <button
              className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                state.strategy === "delete_items"
                  ? "border-red-400 bg-red-50"
                  : "border-[var(--line)] bg-white hover:border-red-300"
              }`}
              onClick={() => onSetState((c) => (c ? { ...c, strategy: "delete_items" } : c))}
              type="button"
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  state.strategy === "delete_items" ? "border-red-500" : "border-[var(--line)]"
                }`}
              >
                {state.strategy === "delete_items" ? (
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                ) : null}
              </span>
              <span>
                <span className="block font-semibold text-[var(--foreground)]">Excluir tudo junto</span>
                <span className="block text-[0.65rem] text-[var(--muted)]">Remove os itens junto com a categoria.</span>
              </span>
            </button>

            {state.strategy === "move_items" ? (
              <Field label="Categoria de destino" required>
                <select
                  className="input"
                  onChange={(e) =>
                    onSetState((c) => (c ? { ...c, targetCategoryId: e.target.value } : c))
                  }
                  value={state.targetCategoryId}
                >
                  <option value="">Selecione…</option>
                  {categoryList
                    .filter((c) => c.id !== state.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </Field>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.7rem] text-amber-800">
          Itens com pedidos históricos podem bloquear a exclusão.
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
            disabled={deleting || (state.strategy === "move_items" && !state.targetCategoryId)}
            onClick={() => void onConfirm()}
            type="button"
          >
            {deleting ? "Excluindo…" : "Excluir categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}
