"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/utils";
import { DeleteDialog } from "./ingredients/delete-dialog";
import { GroupCard } from "./ingredients/group-card";
import { GroupEditorModal } from "./ingredients/group-editor-modal";
import { asNumber, emptyEditor } from "./ingredients/helpers";
import { PlusIcon, SearchIcon } from "./ingredients/icons";
import type {
  DashboardIngredientManagerProps,
  DeleteState,
  EditorOptionItem,
  EditorState,
  OptionGroupSummary,
  StatusFilter,
  ToastState,
} from "./ingredients/types";

export function DashboardIngredientManager({
  optionGroups,
}: DashboardIngredientManagerProps) {
  const [groups, setGroups] = useState(optionGroups);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [toast, setToast] = useState<ToastState>(null);
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
      ? groups.reduce(
          (sum, g) =>
            sum + g.options.reduce((s, o) => s + asNumber(o.priceDelta), 0),
          0,
        ) / totalItems
      : 0;

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
      items: [
        ...c.items,
        { name: "", priceDelta: "0", isDefault: false, isActive: true },
      ],
    }));
  }

  function removeItem(index: number) {
    setEditor((c) => ({ ...c, items: c.items.filter((_, i) => i !== index) }));
  }

  function updateItem(
    index: number,
    field: keyof EditorOptionItem,
    value: string | boolean,
  ) {
    setEditor((c) => ({
      ...c,
      items: c.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

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

  return (
    <main className="space-y-4 text-[var(--foreground)]">
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
              className={`px-3 py-2 text-xs font-semibold transition ${
                statusFilter === value
                  ? "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                  : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              key={value}
              onClick={() => setStatusFilter(value)}
              type="button"
            >
              {value === "all" ? "Todos" : value === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

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
              group={group}
              key={group.id}
              onDelete={() => setDeleteState({ id: group.id, name: group.name, optionCount: group.options.length })}
              onEdit={() => openEditor(group)}
              onToggleActive={() => void toggleActive(group)}
            />
          ))}
        </section>
      )}

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
