import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Typography } from "@/components/ui/typography";
import { formatMoney } from "@/lib/utils";
import { Field, Toggle } from "./form-controls";
import { totalDelta } from "./helpers";
import { CloseIcon, PlusIcon, TrashIcon } from "./icons";
import type { EditorOptionItem, EditorState } from "./types";

export function GroupEditorModal({
  editor,
  onAddItem,
  onClose,
  onRemoveItem,
  onSave,
  onSetEditor,
  onUpdateItem,
  saving,
}: {
  editor: EditorState;
  onAddItem: () => void;
  onClose: () => void;
  onRemoveItem: (index: number) => void;
  onSave: () => Promise<void>;
  onSetEditor: Dispatch<SetStateAction<EditorState>>;
  onUpdateItem: (index: number, field: keyof EditorOptionItem, value: string | boolean) => void;
  saving: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, saving]);

  const itemsSum = totalDelta(editor.items);

  return (
    <Modal
      bodyClassName="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5"
      closeDisabled={saving}
      closeIcon={<CloseIcon />}
      contentClassName="flex max-h-[92dvh] max-w-3xl flex-col"
      eyebrow={editor.id ? "Editando grupo" : "Novo grupo"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button disabled={saving} onClick={onClose} size="sm" variant="secondary">Cancelar</Button>
          <Button disabled={saving || !editor.name.trim()} onClick={() => void onSave()} size="sm">
            {saving ? "Salvando…" : editor.id ? "Salvar alterações" : "Criar grupo"}
          </Button>
        </div>
      }
      footerClassName="border-t border-[var(--line)] px-5 py-3"
      headerClassName="border-b border-[var(--line)] px-5 py-4"
      onClose={onClose}
      placement="bottom"
      size="lg"
      title={editor.name.trim() || "Sem nome"}
    >
          <section className="space-y-3">
            <Typography tone="muted" variant="caption-sm">Dados do grupo</Typography>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome do grupo" required>
                <input
                  autoFocus
                  className="input"
                  onChange={(e) => onSetEditor((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Ex.: Adicionais de burger"
                  value={editor.name}
                />
              </Field>
              <Field label="Slug" hint="Gerado automaticamente">
                <input
                  className="input"
                  onChange={(e) => onSetEditor((c) => ({ ...c, slug: e.target.value }))}
                  placeholder="adicionais-burger"
                  value={editor.slug}
                />
              </Field>
            </div>

            <Field label="Descrição" hint="Visível ao cliente">
              <input
                className="input"
                onChange={(e) => onSetEditor((c) => ({ ...c, description: e.target.value }))}
                placeholder="Escolha até 3 adicionais"
                value={editor.description}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Mín. seleções">
                <input
                  className="input"
                  inputMode="numeric"
                  min="0"
                  onChange={(e) => onSetEditor((c) => ({ ...c, minSelections: e.target.value }))}
                  type="number"
                  value={editor.minSelections}
                />
              </Field>
              <Field label="Máx. seleções" hint="Vazio = sem limite">
                <input
                  className="input"
                  inputMode="numeric"
                  min="1"
                  onChange={(e) => onSetEditor((c) => ({ ...c, maxSelections: e.target.value }))}
                  placeholder="Sem limite"
                  type="number"
                  value={editor.maxSelections}
                />
              </Field>
              <Field label="Ordem">
                <input
                  className="input"
                  inputMode="numeric"
                  min="0"
                  onChange={(e) => onSetEditor((c) => ({ ...c, sortOrder: e.target.value }))}
                  type="number"
                  value={editor.sortOrder}
                />
              </Field>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle
                checked={editor.isRequired}
                hint="Cliente precisa escolher"
                label="Grupo obrigatório"
                onChange={(v) => onSetEditor((c) => ({ ...c, isRequired: v }))}
              />
              <Toggle
                checked={editor.isActive}
                hint="Visível no cardápio"
                label="Grupo ativo"
                onChange={(v) => onSetEditor((c) => ({ ...c, isActive: v }))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Typography tone="muted" variant="caption-sm">Opções do grupo</Typography>
                <Typography className="mt-0.5" variant="caption">
                  {editor.items.length} {editor.items.length === 1 ? "opção" : "opções"}
                  {itemsSum > 0 ? ` · soma ${formatMoney(itemsSum)}` : ""}
                </Typography>
              </div>
              <Button className="hover:border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/5" onClick={onAddItem} size="xs" variant="secondary">
                <PlusIcon />
                Adicionar opção
              </Button>
            </div>

            {editor.items.length === 0 ? (
              <EmptyState className="bg-[var(--background)] text-xs">
                Nenhuma opção. Clique em <strong>Adicionar opção</strong> para começar.
              </EmptyState>
            ) : (
              <div className="space-y-2">
                {editor.items.map((item, index) => (
                  <OptionRow
                    index={index}
                    item={item}
                    key={index}
                    onRemove={() => onRemoveItem(index)}
                    onUpdate={(field, value) => onUpdateItem(index, field, value)}
                  />
                ))}
              </div>
            )}
          </section>
    </Modal>
  );
}

function OptionRow({
  index,
  item,
  onRemove,
  onUpdate,
}: {
  index: number;
  item: EditorOptionItem;
  onRemove: () => void;
  onUpdate: (field: keyof EditorOptionItem, value: string | boolean) => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border bg-white p-3 sm:flex-row sm:items-center ${
        item.isActive ? "border-[var(--line)]" : "border-[var(--line)] opacity-70"
      }`}
    >
      <div className="flex items-center gap-2 sm:w-8">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--background)] text-[0.65rem] font-bold text-[var(--muted)]">
          {index + 1}
        </span>
      </div>
      <input
        aria-label="Nome da opção"
        className="input flex-1"
        onChange={(e) => onUpdate("name", e.target.value)}
        placeholder="Ex.: Bacon extra"
        value={item.name}
      />
      <div className="flex items-center gap-1 sm:w-28">
        <span className="text-[0.65rem] font-bold text-[var(--muted)]">+R$</span>
        <input
          aria-label="Preço"
          className="input"
          inputMode="decimal"
          onChange={(e) => onUpdate("priceDelta", e.target.value)}
          placeholder="0"
          value={item.priceDelta}
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          className={`rounded-lg border px-2 py-1.5 text-[0.65rem] font-semibold transition ${
            item.isDefault
              ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
              : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => onUpdate("isDefault", !item.isDefault)}
          title="Marcar como padrão"
          type="button"
        >
          ★ Padrão
        </button>
        <button
          className={`rounded-lg border px-2 py-1.5 text-[0.65rem] font-semibold transition ${
            item.isActive
              ? "border-[var(--brand-green)] bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]"
              : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => onUpdate("isActive", !item.isActive)}
          type="button"
        >
          {item.isActive ? "Ativo" : "Inativo"}
        </button>
        <button
          className="rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
          onClick={onRemove}
          title="Remover opção"
          type="button"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
