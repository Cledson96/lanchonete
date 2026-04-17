"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/utils";

/* ═══════════════════════════════════════════════
   Types
═══════════════════════════════════════════════ */

type OptionItemSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceDelta: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

type OptionGroupSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  minSelections: number;
  maxSelections: number | null;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  options: OptionItemSummary[];
};

type Props = { optionGroups: OptionGroupSummary[] };

type EditorOptionItem = {
  id?: string;
  name: string;
  priceDelta: string;
  isDefault: boolean;
  isActive: boolean;
};

type EditorState = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  minSelections: string;
  maxSelections: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: string;
  items: EditorOptionItem[];
};

type DeleteState = { id: string; name: string; optionCount: number } | null;
type StatusFilter = "all" | "active" | "inactive";

const emptyEditor: EditorState = {
  id: null,
  name: "",
  slug: "",
  description: "",
  minSelections: "0",
  maxSelections: "",
  isRequired: false,
  isActive: true,
  sortOrder: "0",
  items: [],
};

function asNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

function totalDelta(items: EditorOptionItem[]) {
  return items.reduce((sum, item) => sum + Number(item.priceDelta || 0), 0);
}

/* ═══════════════════════════════════════════════
   Icons
═══════════════════════════════════════════════ */

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M21 21l-5.2-5.2M11 18a7 7 0 110-14 7 7 0 010 14z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════ */

export function DashboardIngredientManager({ optionGroups }: Props) {
  const [groups, setGroups] = useState(optionGroups);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [deleting, setDeleting] = useState(false);

  const refreshGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/menu/option-groups");
      const json = await response.json();
      if (json.optionGroups) setGroups(json.optionGroups);
    } catch {}
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      if (statusFilter === "active" && !g.isActive) return false;
      if (statusFilter === "inactive" && g.isActive) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        (g.description || "").toLowerCase().includes(q) ||
        g.options.some((o) => o.name.toLowerCase().includes(q))
      );
    });
  }, [groups, search, statusFilter]);

  const totalGroups = groups.length;
  const totalItems = groups.reduce((sum, g) => sum + g.options.length, 0);
  const activeGroups = groups.filter((g) => g.isActive).length;
  const avgDelta =
    totalItems > 0
      ? groups.reduce((sum, g) => sum + g.options.reduce((s, o) => s + asNumber(o.priceDelta), 0), 0) / totalItems
      : 0;

  /* ── Handlers ── */

  function openEditor(group?: OptionGroupSummary) {
    if (group) {
      setEditor({
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description || "",
        minSelections: String(group.minSelections),
        maxSelections: group.maxSelections != null ? String(group.maxSelections) : "",
        isRequired: group.isRequired,
        isActive: group.isActive,
        sortOrder: String(group.sortOrder),
        items: group.options.map((o) => ({
          id: o.id,
          name: o.name,
          priceDelta: String(asNumber(o.priceDelta)),
          isDefault: o.isDefault,
          isActive: o.isActive,
        })),
      });
    } else {
      setEditor(emptyEditor);
    }
    setIsEditorOpen(true);
  }

  function addItem() {
    setEditor((c) => ({
      ...c,
      items: [...c.items, { name: "", priceDelta: "0", isDefault: false, isActive: true }],
    }));
  }

  function removeItem(index: number) {
    setEditor((c) => ({ ...c, items: c.items.filter((_, i) => i !== index) }));
  }

  function updateItem(index: number, field: keyof EditorOptionItem, value: string | boolean) {
    setEditor((c) => ({
      ...c,
      items: c.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  /* ── Async ── */

  async function saveGroup() {
    try {
      setSaving(true);
      setToast(null);
      const payload = {
        ...(editor.id ? { id: editor.id } : {}),
        name: editor.name,
        slug: editor.slug || undefined,
        description: editor.description || undefined,
        minSelections: Number(editor.minSelections) || 0,
        maxSelections: editor.maxSelections ? Number(editor.maxSelections) : undefined,
        isRequired: editor.isRequired,
        isActive: editor.isActive,
        sortOrder: Number(editor.sortOrder) || 0,
        options: editor.items.map((item, index) => ({
          name: item.name,
          priceDelta: Number(item.priceDelta) || 0,
          isDefault: item.isDefault,
          isActive: item.isActive,
          sortOrder: index,
        })),
      };
      const response = await fetch("/api/menu/option-groups", {
        method: editor.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message || "Não foi possível salvar.");
      await refreshGroups();
      setToast({ tone: "success", message: editor.id ? "Grupo atualizado." : "Grupo criado." });
      setIsEditorOpen(false);
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Erro ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(group: OptionGroupSummary) {
    try {
      setToast(null);
      const response = await fetch("/api/menu/option-groups", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: group.id, isActive: !group.isActive }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message || "Erro ao atualizar.");
      await refreshGroups();
      setToast({ tone: "success", message: group.isActive ? "Grupo desativado." : "Grupo ativado." });
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Erro ao atualizar." });
    }
  }

  async function deleteGroup() {
    if (!deleteState) return;
    try {
      setDeleting(true);
      setToast(null);
      const response = await fetch(`/api/menu/option-groups?id=${deleteState.id}`, { method: "DELETE" });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json?.error?.message || "Erro ao excluir.");
      }
      await refreshGroups();
      setToast({ tone: "success", message: "Grupo excluído." });
      setDeleteState(null);
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Erro ao excluir." });
    } finally {
      setDeleting(false);
    }
  }

  /* ═══════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════ */

  return (
    <main className="space-y-4 text-[var(--foreground)]">
      {/* ─── Header compacto ─── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-[var(--muted)]">Catálogo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Ingredientes &amp; Adicionais</h1>
          <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
            {totalGroups} grupos ({activeGroups} ativos) · {totalItems} opções · média {formatMoney(avgDelta)}
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 self-start rounded-full bg-[var(--brand-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
          onClick={() => openEditor()}
          type="button"
        >
          <PlusIcon />
          Novo grupo
        </button>
      </section>

      {/* ─── Toast ─── */}
      {toast ? (
        <div
          className={`rounded-xl border px-4 py-2 text-xs font-medium ${
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {/* ─── Filtros ─── */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <SearchIcon />
          </span>
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--brand-orange)]"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar grupo, opção ou descrição…"
            value={search}
          />
        </div>
        <div className="flex overflow-hidden rounded-xl border border-[var(--line)]">
          {(["all", "active", "inactive"] as const).map((value) => (
            <button
              key={value}
              className={`px-3 py-2 text-xs font-semibold transition ${
                statusFilter === value
                  ? "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                  : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setStatusFilter(value)}
              type="button"
            >
              {value === "all" ? "Todos" : value === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Lista ─── */}
      {filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center text-sm text-[var(--muted)]">
          {totalGroups === 0
            ? "Nenhum grupo cadastrado. Clique em 'Novo grupo' para começar."
            : "Nenhum grupo bate com os filtros. Ajuste a busca ou status."}
        </div>
      ) : (
        <section className="grid gap-3 lg:grid-cols-2">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onDelete={() => setDeleteState({ id: group.id, name: group.name, optionCount: group.options.length })}
              onEdit={() => openEditor(group)}
              onToggleActive={() => void toggleActive(group)}
            />
          ))}
        </section>
      )}

      {/* ─── Modais ─── */}
      {isEditorOpen ? (
        <GroupEditorModal
          editor={editor}
          onAddItem={addItem}
          onClose={() => setIsEditorOpen(false)}
          onRemoveItem={removeItem}
          onSave={saveGroup}
          onSetEditor={setEditor}
          onUpdateItem={updateItem}
          saving={saving}
        />
      ) : null}

      {deleteState ? (
        <DeleteDialog
          deleting={deleting}
          onClose={() => (deleting ? undefined : setDeleteState(null))}
          onConfirm={deleteGroup}
          state={deleteState}
        />
      ) : null}
    </main>
  );
}

/* ═══════════════════════════════════════════════
   Group card
═══════════════════════════════════════════════ */

function GroupCard({
  group,
  onDelete,
  onEdit,
  onToggleActive,
}: {
  group: OptionGroupSummary;
  onDelete: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-sm transition hover:border-[var(--brand-orange)]/40 hover:shadow-md ${
        group.isActive ? "border-[var(--line)]" : "border-[var(--line)] opacity-75"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-bold leading-tight">{group.name}</h3>
            {!group.isActive ? (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[0.6rem] font-bold text-red-700">Inativo</span>
            ) : null}
            {group.isRequired ? (
              <span className="rounded-full bg-[var(--brand-orange)]/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-[var(--brand-orange-dark)]">
                Obrigatório
              </span>
            ) : null}
          </div>
          {group.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted)]">{group.description}</p>
          ) : null}
          <p className="mt-1 text-[0.65rem] text-[var(--muted)]">
            {group.options.length} {group.options.length === 1 ? "opção" : "opções"}
            {group.minSelections > 0 ? ` · mín ${group.minSelections}` : ""}
            {group.maxSelections ? ` · máx ${group.maxSelections}` : ""}
          </p>
        </div>
      </div>

      {/* Opções */}
      {group.options.length > 0 ? (
        <div className="border-t border-[var(--line)] bg-[var(--background)]/40 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {group.options.slice(0, 8).map((option) => {
              const delta = asNumber(option.priceDelta);
              return (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.65rem] font-medium ${
                    !option.isActive
                      ? "bg-gray-100 text-gray-400 line-through"
                      : delta > 0
                      ? "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]"
                      : "bg-[var(--background)] text-[var(--muted)]"
                  }`}
                  key={option.id}
                >
                  {option.isDefault ? <span className="text-[var(--brand-orange)]">★</span> : null}
                  {option.name}
                  {delta > 0 ? <span className="opacity-70">+{formatMoney(delta)}</span> : null}
                </span>
              );
            })}
            {group.options.length > 8 ? (
              <span className="inline-flex items-center rounded-md bg-[var(--background)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--muted)]">
                +{group.options.length - 8}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="border-t border-[var(--line)] bg-[var(--background)]/40 px-4 py-3 text-[0.65rem] text-[var(--muted)]">
          Sem opções — edite para adicionar.
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-1 border-t border-[var(--line)] p-2">
        <button
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--brand-orange)] px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
          onClick={onEdit}
          type="button"
        >
          <EditIcon />
          Editar
        </button>
        <button
          className="rounded-lg border border-[var(--line)] px-2 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
          onClick={onToggleActive}
          type="button"
        >
          {group.isActive ? "Pausar" : "Ativar"}
        </button>
        <button
          className="rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
          onClick={onDelete}
          title="Excluir"
          type="button"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════
   Group editor modal
═══════════════════════════════════════════════ */

function GroupEditorModal({
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
  onSetEditor: React.Dispatch<React.SetStateAction<EditorState>>;
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
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(45,24,11,0.45)] backdrop-blur-[3px] sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              {editor.id ? "Editando grupo" : "Novo grupo"}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-bold leading-tight">
              {editor.name.trim() || "Sem nome"}
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

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Dados do grupo */}
          <section className="space-y-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Dados do grupo
            </p>
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

          {/* Opções */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Opções do grupo
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground)]">
                  {editor.items.length} {editor.items.length === 1 ? "opção" : "opções"}
                  {itemsSum > 0 ? ` · soma ${formatMoney(itemsSum)}` : ""}
                </p>
              </div>
              <button
                className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/5"
                onClick={onAddItem}
                type="button"
              >
                <PlusIcon />
                Adicionar opção
              </button>
            </div>

            {editor.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-8 text-center text-xs text-[var(--muted)]">
                Nenhuma opção. Clique em <strong>Adicionar opção</strong> para começar.
              </div>
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
        </div>

        {/* Footer */}
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
            {saving ? "Salvando…" : editor.id ? "Salvar alterações" : "Criar grupo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Option row ── */

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

/* ═══════════════════════════════════════════════
   Delete dialog
═══════════════════════════════════════════════ */

function DeleteDialog({
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

/* ═══════════════════════════════════════════════
   Shared primitives
═══════════════════════════════════════════════ */

function Field({
  children,
  hint,
  label,
  required,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
        {required ? <span className="text-[var(--brand-orange)]">*</span> : null}
        {hint ? (
          <span className="ml-1 text-[0.6rem] normal-case tracking-normal text-[var(--muted)]/70">· {hint}</span>
        ) : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({
  checked,
  hint,
  label,
  onChange,
}: {
  checked: boolean;
  hint?: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
        checked
          ? "border-[var(--brand-green)] bg-[var(--brand-green)]/5"
          : "border-[var(--line)] bg-white hover:border-[var(--brand-green)]/40"
      }`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <div>
        <span className="block font-semibold text-[var(--foreground)]">{label}</span>
        {hint ? <span className="block text-[0.6rem] text-[var(--muted)]">{hint}</span> : null}
      </div>
      <span
        className={`flex h-5 w-9 shrink-0 items-center rounded-full border transition ${
          checked ? "border-[var(--brand-green)] bg-[var(--brand-green)]" : "border-[var(--line)] bg-white"
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
