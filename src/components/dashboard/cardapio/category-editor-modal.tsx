import { useEffect } from "react";
import { Field, Toggle } from "./form-controls";
import { CloseIcon } from "./icons";
import type { CategoryEditorState } from "./types";

export function CategoryEditorModal({
  editor,
  onClose,
  onSave,
  onSetEditor,
  saving,
}: {
  editor: CategoryEditorState;
  onClose: () => void;
  onSave: () => Promise<void>;
  onSetEditor: React.Dispatch<React.SetStateAction<CategoryEditorState>>;
  saving: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, saving]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(45,24,11,0.45)] p-4 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Categoria</p>
            <h2 className="mt-0.5 text-lg font-bold leading-tight">
              {editor.id ? "Editar categoria" : "Nova categoria"}
            </h2>
          </div>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5">
          <Field label="Nome" required>
            <input
              autoFocus
              className="input"
              onChange={(e) => onSetEditor((c) => ({ ...c, name: e.target.value }))}
              placeholder="Ex: Combos"
              value={editor.name}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug" hint="Gerado automaticamente">
              <input
                className="input"
                onChange={(e) => onSetEditor((c) => ({ ...c, slug: e.target.value }))}
                placeholder="combos"
                value={editor.slug}
              />
            </Field>
            <Field label="Ordem">
              <input
                className="input"
                inputMode="numeric"
                onChange={(e) => onSetEditor((c) => ({ ...c, sortOrder: e.target.value }))}
                value={editor.sortOrder}
              />
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              className="input min-h-[72px] resize-none"
              onChange={(e) => onSetEditor((c) => ({ ...c, description: e.target.value }))}
              value={editor.description}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Disponível de">
              <input
                className="input"
                onChange={(e) => onSetEditor((c) => ({ ...c, availableFrom: e.target.value }))}
                type="time"
                value={editor.availableFrom}
              />
            </Field>
            <Field label="Disponível até">
              <input
                className="input"
                onChange={(e) => onSetEditor((c) => ({ ...c, availableUntil: e.target.value }))}
                type="time"
                value={editor.availableUntil}
              />
            </Field>
          </div>

          <Toggle
            checked={editor.isActive}
            hint="Categoria visível no cardápio"
            label="Categoria ativa"
            onChange={(v) => onSetEditor((c) => ({ ...c, isActive: v }))}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--line)] px-5 py-3">
          <button
            className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-full bg-[var(--brand-orange)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || !editor.name.trim()}
            onClick={() => void onSave()}
            type="button"
          >
            {saving ? "Salvando…" : editor.id ? "Salvar alterações" : "Criar categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}
