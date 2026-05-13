import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Typography } from "@/components/ui/typography";
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
    <Modal
      closeDisabled={deleting}
      closeIcon={<CloseIcon />}
      eyebrow="Excluir categoria"
      footer={
        <div className="flex gap-2">
          <Button disabled={deleting} fullWidth onClick={onClose} size="sm" variant="secondary">Cancelar</Button>
          <Button
            disabled={deleting || (state.strategy === "move_items" && !state.targetCategoryId)}
            fullWidth
            onClick={() => void onConfirm()}
            size="sm"
            variant="danger"
          >
            {deleting ? "Excluindo…" : "Excluir categoria"}
          </Button>
        </div>
      }
      onClose={onClose}
      title={state.name}
    >
      <Typography tone="muted" variant="caption">
        {state.itemCount > 0
          ? `Essa categoria tem ${state.itemCount} ${state.itemCount === 1 ? "item" : "itens"}. Escolha o destino antes de excluir.`
          : "Categoria vazia — pode ser excluída diretamente."}
      </Typography>

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

      <Alert className="mt-3" tone="warning">Itens com pedidos históricos podem bloquear a exclusão.</Alert>
    </Modal>
  );
}
