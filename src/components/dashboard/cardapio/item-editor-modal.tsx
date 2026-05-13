import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Typography } from "@/components/ui/typography";
import { MENU_WEEKDAYS } from "@/lib/menu-item-availability";
import { Field, Toggle } from "./form-controls";
import { toggleWeekday } from "./helpers";
import { CloseIcon } from "./icons";
import type {
  CategorySummary,
  EditorState,
  EditorTab,
  IngredientSummary,
  NormalizedMenuItem,
  OptionGroupSummary,
} from "./types";

type ItemEditorModalProps = {
  categoryList: CategorySummary[];
  componentCandidates: NormalizedMenuItem[];
  editor: EditorState;
  ingredients: IngredientSummary[];
  isEditingExisting: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onSave: () => Promise<void>;
  onSetEditor: React.Dispatch<React.SetStateAction<EditorState>>;
  onTabChange: (tab: EditorTab) => void;
  onToggleComboComponent: (id: string) => void;
  onToggleIngredient: (id: string) => void;
  onToggleOptionGroup: (id: string) => void;
  onUpdateComboQuantity: (id: string, quantity: string) => void;
  optionGroups: OptionGroupSummary[];
  saving: boolean;
  tab: EditorTab;
};

export function ItemEditorModal({
  categoryList,
  componentCandidates,
  editor,
  ingredients,
  isEditingExisting,
  onClose,
  onCreateNew,
  onSave,
  onSetEditor,
  onTabChange,
  onToggleComboComponent,
  onToggleIngredient,
  onToggleOptionGroup,
  onUpdateComboQuantity,
  optionGroups,
  saving,
  tab,
}: ItemEditorModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, saving]);

  const tabs: Array<{ id: EditorTab; label: string; hint?: string }> = [
    { id: "basic", label: "Básico" },
    { id: "options", label: "Opcionais", hint: `${editor.optionGroupIds.length}` },
    { id: "ingredients", label: "Ingredientes", hint: `${editor.ingredientIds.length}` },
    ...(editor.kind === "combo"
      ? ([{ id: "combo", label: "Combo", hint: `${editor.comboComponents.length}` }] as const)
      : []),
  ];

  return (
    <Modal
      bodyClassName="min-h-0 flex-1 overflow-y-auto px-5 py-5"
      closeDisabled={saving}
      closeIcon={<CloseIcon />}
      contentClassName="flex max-h-[92dvh] max-w-3xl flex-col"
      eyebrow={isEditingExisting ? "Editando item" : "Novo item"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button disabled={saving} onClick={onClose} size="sm" variant="secondary">Cancelar</Button>
          <Button disabled={saving || !editor.name.trim() || !editor.price} onClick={() => void onSave()} size="sm">
            {saving ? "Salvando…" : isEditingExisting ? "Salvar alterações" : "Criar item"}
          </Button>
        </div>
      }
      footerClassName="border-t border-[var(--line)] px-5 py-3"
      headerActions={
        isEditingExisting ? <Button onClick={onCreateNew} size="xs" variant="secondary">Novo</Button> : null
      }
      headerClassName="border-b border-[var(--line)] px-5 py-4"
      onClose={onClose}
      placement="bottom"
      size="lg"
      title={editor.name.trim() || "Sem nome"}
    >
      <div className="-mx-5 -mt-5 flex shrink-0 gap-1 border-b border-[var(--line)] px-5">
          {tabs.map((t) => (
            <button
              className={`relative flex items-center px-3 py-2.5 text-xs font-semibold transition ${
                tab === t.id
                  ? "text-[var(--brand-orange-dark)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              key={t.id}
              onClick={() => onTabChange(t.id)}
              type="button"
            >
              {t.label}
              {t.hint && t.hint !== "0" ? (
                <Badge className="ml-1.5 bg-[var(--brand-orange)]/15 px-1.5 py-0.5 text-[0.6rem] text-[var(--brand-orange-dark)]">
                  {t.hint}
                </Badge>
              ) : null}
              {tab === t.id ? (
                <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[var(--brand-orange)]" />
              ) : null}
            </button>
          ))}
      </div>

      {tab === "basic" ? (
        <BasicTab categoryList={categoryList} editor={editor} onSetEditor={onSetEditor} />
      ) : null}
      {tab === "options" ? (
        <OptionsTab editor={editor} onToggle={onToggleOptionGroup} optionGroups={optionGroups} />
      ) : null}
      {tab === "ingredients" ? (
        <IngredientsTab editor={editor} ingredients={ingredients} onToggle={onToggleIngredient} />
      ) : null}
      {tab === "combo" && editor.kind === "combo" ? (
        <ComboTab
          candidates={componentCandidates}
          editor={editor}
          onToggle={onToggleComboComponent}
          onUpdateQuantity={onUpdateComboQuantity}
        />
      ) : null}
    </Modal>
  );
}

function BasicTab({
  categoryList,
  editor,
  onSetEditor,
}: {
  categoryList: CategorySummary[];
  editor: EditorState;
  onSetEditor: React.Dispatch<React.SetStateAction<EditorState>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do item" required>
          <input
            autoFocus
            className="input"
            onChange={(e) => onSetEditor((c) => ({ ...c, name: e.target.value }))}
            placeholder="Ex: X-Burger"
            value={editor.name}
          />
        </Field>
        <Field label="Categoria" required>
          <select
            className="input"
            onChange={(e) => onSetEditor((c) => ({ ...c, categoryId: e.target.value }))}
            value={editor.categoryId}
          >
            {categoryList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Preço" required>
          <input
            className="input"
            inputMode="decimal"
            onChange={(e) => onSetEditor((c) => ({ ...c, price: e.target.value }))}
            placeholder="0,00"
            value={editor.price}
          />
        </Field>
        <Field label="Preço de" hint="Riscado">
          <input
            className="input"
            inputMode="decimal"
            onChange={(e) => onSetEditor((c) => ({ ...c, compareAtPrice: e.target.value }))}
            placeholder="0,00"
            value={editor.compareAtPrice}
          />
        </Field>
        <Field label="Tipo">
          <select
            className="input"
            onChange={(e) => onSetEditor((c) => ({ ...c, kind: e.target.value as "simples" | "combo" }))}
            value={editor.kind}
          >
            <option value="simples">Simples</option>
            <option value="combo">Combo</option>
          </select>
        </Field>
      </div>

      <Field label="Descrição" hint="Visível ao cliente no cardápio">
        <textarea
          className="input min-h-[80px] resize-none"
          onChange={(e) => onSetEditor((c) => ({ ...c, ingredients: e.target.value }))}
          placeholder="Pão brioche, carne 180g, queijo cheddar, alface…"
          value={editor.ingredients}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Slug" hint="Opcional, gerado automaticamente">
          <input
            className="input"
            onChange={(e) => onSetEditor((c) => ({ ...c, slug: e.target.value }))}
            placeholder="x-burger"
            value={editor.slug}
          />
        </Field>
        <Field label="Ordem de exibição">
          <input
            className="input"
            inputMode="numeric"
            onChange={(e) => onSetEditor((c) => ({ ...c, sortOrder: e.target.value }))}
            value={editor.sortOrder}
          />
        </Field>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          checked={editor.isActive}
          hint="Visível no cardápio público"
          label="Item ativo"
          onChange={(v) => onSetEditor((c) => ({ ...c, isActive: v }))}
        />
        <Toggle
          checked={editor.isFeatured}
          hint="Mostrar como destaque"
          label="Em destaque"
          onChange={(v) => onSetEditor((c) => ({ ...c, isFeatured: v }))}
        />
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--background)] p-3">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="caption">Dias disponíveis</Typography>
            <Typography tone="muted" variant="caption-sm">Vazio = todos os dias</Typography>
          </div>
          <Button onClick={() => onSetEditor((c) => ({ ...c, availableWeekdays: [] }))} size="xs" variant="secondary">
            Todos os dias
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MENU_WEEKDAYS.map((w) => {
            const selected = editor.availableWeekdays.includes(w.value);
            return (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selected
                    ? "border-[var(--brand-green)] bg-[var(--brand-green)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--brand-green)]/40"
                }`}
                key={w.value}
                onClick={() =>
                  onSetEditor((c) => ({
                    ...c,
                    availableWeekdays: toggleWeekday(c.availableWeekdays, w.value),
                  }))
                }
                type="button"
              >
                {w.short}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OptionsTab({
  editor,
  onToggle,
  optionGroups,
}: {
  editor: EditorState;
  onToggle: (id: string) => void;
  optionGroups: OptionGroupSummary[];
}) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(
    () => optionGroups.filter((g) => g.name.toLowerCase().includes(filter.trim().toLowerCase())),
    [optionGroups, filter]
  );

  return (
    <div className="space-y-3">
      <Typography tone="muted" variant="caption">
        Selecione os grupos de adicionais que aparecem ao cliente (bebidas, molhos, bordas etc).
      </Typography>
      {optionGroups.length > 6 ? (
        <input
          className="input"
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar grupo…"
          value={filter}
        />
      ) : null}
      {filtered.length === 0 ? (
        <EmptyState className="bg-[var(--background)] text-xs">
          {optionGroups.length === 0 ? "Nenhum grupo cadastrado." : "Nenhum grupo bate com a busca."}
        </EmptyState>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((g) => {
            const selected = editor.optionGroupIds.includes(g.id);
            return (
              <button
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                  selected
                    ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                    : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--brand-orange)]/40"
                }`}
                key={g.id}
                onClick={() => onToggle(g.id)}
                type="button"
              >
                <span>{g.name}</span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                    selected ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]" : "border-[var(--line)]"
                  }`}
                >
                  {selected ? (
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IngredientsTab({
  editor,
  ingredients,
  onToggle,
}: {
  editor: EditorState;
  ingredients: IngredientSummary[];
  onToggle: (id: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(
    () => ingredients.filter((i) => i.name.toLowerCase().includes(filter.trim().toLowerCase())),
    [ingredients, filter]
  );

  return (
    <div className="space-y-3">
      <Typography tone="muted" variant="caption">
        Ingredientes que compõem o item. O cliente poderá remover ou pedir adicional no pedido.
      </Typography>
      {ingredients.length > 8 ? (
        <input
          className="input"
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar ingrediente…"
          value={filter}
        />
      ) : null}
      {filtered.length === 0 ? (
        <EmptyState className="bg-[var(--background)] text-xs">
          {ingredients.length === 0 ? "Nenhum ingrediente cadastrado." : "Nenhum ingrediente bate com a busca."}
        </EmptyState>
      ) : (
        <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((ing) => {
            const selected = editor.ingredientIds.includes(ing.id);
            return (
              <button
                className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition ${
                  selected
                    ? "border-[var(--brand-green)] bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]"
                    : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--brand-green)]/40"
                }`}
                key={ing.id}
                onClick={() => onToggle(ing.id)}
                type="button"
              >
                <span className="truncate">{ing.name}</span>
                <span
                  className={`ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    selected ? "border-[var(--brand-green)] bg-[var(--brand-green)]" : "border-[var(--line)]"
                  }`}
                >
                  {selected ? (
                    <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ComboTab({
  candidates,
  editor,
  onToggle,
  onUpdateQuantity,
}: {
  candidates: NormalizedMenuItem[];
  editor: EditorState;
  onToggle: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);

  const filtered = useMemo(() => {
    const selectedIds = new Set(editor.comboComponents.map((c) => c.componentMenuItemId));
    const q = filter.trim().toLowerCase();
    return candidates.filter((c) => {
      if (onlySelected && !selectedIds.has(c.id)) return false;
      if (!q) return true;
      return `${c.name} ${c.category.name}`.toLowerCase().includes(q);
    });
  }, [candidates, filter, onlySelected, editor.comboComponents]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="input flex-1"
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar item do combo…"
          value={filter}
        />
        <Button
          className={onlySelected ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]" : undefined}
          onClick={() => setOnlySelected(!onlySelected)}
          size="sm"
          variant="secondary"
        >
          Apenas selecionados ({editor.comboComponents.length})
        </Button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState className="bg-[var(--background)] text-xs">
          Nenhum item bate com os filtros.
        </EmptyState>
      ) : (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {filtered.map((c) => {
            const selected = editor.comboComponents.find((x) => x.componentMenuItemId === c.id);
            return (
              <div
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition ${
                  selected
                    ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/5"
                    : "border-[var(--line)] bg-white"
                }`}
                key={c.id}
              >
                <button
                  className="flex flex-1 items-center gap-2 text-left"
                  onClick={() => onToggle(c.id)}
                  type="button"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition ${
                      selected
                        ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]"
                        : "border-[var(--line)]"
                    }`}
                  >
                    {selected ? (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[var(--foreground)]">{c.name}</span>
                    <span className="block truncate text-[0.6rem] text-[var(--muted)]">{c.category.name}</span>
                  </span>
                </button>
                {selected ? (
                  <input
                    aria-label="Quantidade"
                    className="w-14 rounded-md border border-[var(--line)] bg-white px-2 py-1 text-center text-xs"
                    inputMode="numeric"
                    min="1"
                    onChange={(e) => onUpdateQuantity(c.id, e.target.value)}
                    type="number"
                    value={selected.quantity}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
