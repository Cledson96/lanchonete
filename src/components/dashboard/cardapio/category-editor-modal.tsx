import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
    <Modal
      bodyClassName="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5"
      closeDisabled={saving}
      closeIcon={<CloseIcon />}
      contentClassName="flex max-h-[92dvh] max-w-lg flex-col"
      eyebrow="Categoria"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button disabled={saving} onClick={onClose} size="sm" variant="secondary">Cancelar</Button>
          <Button disabled={saving || !editor.name.trim()} onClick={() => void onSave()} size="sm">
            {saving ? "Salvando…" : editor.id ? "Salvar alterações" : "Criar categoria"}
          </Button>
        </div>
      }
      footerClassName="border-t border-[var(--line)] px-5 py-3"
      headerClassName="border-b border-[var(--line)] px-5 py-4"
      onClose={onClose}
      title={editor.id ? "Editar categoria" : "Nova categoria"}
    >
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
    </Modal>
  );
}
