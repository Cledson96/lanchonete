"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/utils";

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

type Props = {
  optionGroups: OptionGroupSummary[];
};

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

export function DashboardIngredientManager({ optionGroups }: Props) {
  const [groups, setGroups] = useState(optionGroups);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/menu/option-groups");
      const json = await response.json();
      if (json.optionGroups) {
        setGroups(json.optionGroups);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.options.some((o) => o.name.toLowerCase().includes(q)),
    );
  }, [groups, search]);

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

  function closeEditor() {
    setIsEditorOpen(false);
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
      if (!response.ok) {
        throw new Error(json?.error?.message || "Nao foi possivel salvar.");
      }

      await refreshGroups();
      setToast({ tone: "success", message: editor.id ? "Grupo atualizado." : "Grupo criado." });
      setIsEditorOpen(false);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Erro ao salvar.",
      });
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
      if (!response.ok) {
        throw new Error(json?.error?.message || "Erro ao atualizar.");
      }
      await refreshGroups();
      setToast({ tone: "success", message: group.isActive ? "Grupo desativado." : "Grupo ativado." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Erro ao atualizar.",
      });
    }
  }

  async function deleteGroup(id: string) {
    try {
      setDeletingId(id);
      setToast(null);
      const response = await fetch(`/api/menu/option-groups?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json?.error?.message || "Erro ao excluir.");
      }
      await refreshGroups();
      setToast({ tone: "success", message: "Grupo excluido." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Erro ao excluir.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  function addItem() {
    setEditor((current) => ({
      ...current,
      items: [...current.items, { name: "", priceDelta: "0", isDefault: false, isActive: true }],
    }));
  }

  function removeItem(index: number) {
    setEditor((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));
  }

  function updateItem(index: number, field: keyof EditorOptionItem, value: string | boolean) {
    setEditor((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  const totalGroups = groups.length;
  const totalItems = groups.reduce((sum, g) => sum + g.options.length, 0);
  const activeGroups = groups.filter((g) => g.isActive).length;

  return (
    <main className="space-y-6 text-[var(--foreground)]">
      <section className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm transition hover:border-[var(--brand-orange)]/30 hover:shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-3 text-[var(--muted)]">Catalogo</p>
            <h1 className="text-3xl font-semibold tracking-tight">Ingredientes e adicionais</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Crie grupos de adicionais (ex.: &quot;Adicionais de burger&quot;, &quot;Molhos&quot;) e defina os ingredientes com preco. Depois vincule os grupos aos itens do cardapio.
            </p>
          </div>
          <button
            className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
            onClick={() => openEditor()}
            type="button"
          >
            Novo grupo
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
            <p className="font-medium">Grupos</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{totalGroups} cadastrados ({activeGroups} ativos)</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
            <p className="font-medium">Ingredientes/Opcoes</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{totalItems} cadastrados</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
            <p className="font-medium">Valor medio</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {totalItems
                ? formatMoney(
                    groups.reduce(
                      (sum, g) => sum + g.options.reduce((s, o) => s + asNumber(o.priceDelta), 0),
                      0,
                    ) / totalItems,
                  )
                : "R$ 0,00"}
            </p>
          </article>
        </div>
      </section>

      {toast && (
        <div
          className={`rounded-[1.4rem] border px-4 py-3 text-sm ${
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="space-y-4">
        <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-4">
          <label className="block text-sm text-[var(--muted)]" htmlFor="ingredient-search">
            Buscar grupo ou ingrediente
          </label>
          <input
            className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--background-strong)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/40 focus:border-[var(--brand-orange)]/40"
            id="ingredient-search"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ex.: burger, bacon, molho..."
            value={search}
          />
        </div>

        <div className="space-y-4">
          {filteredGroups.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-[var(--foreground)]">Nenhum grupo encontrado</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {search ? "Tente outro termo de busca." : "Clique em \"Novo grupo\" para criar o primeiro grupo de adicionais."}
              </p>
            </div>
          )}
          {filteredGroups.map((group) => (
            <article
              key={group.id}
              className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_8px_24px_rgba(45,24,11,0.04)] transition hover:border-[var(--brand-orange)]/30 hover:shadow-[0_14px_30px_rgba(242,122,34,0.1)]"
            >
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight">{group.name}</h2>
                    {!group.isActive && (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[0.7rem] font-semibold text-red-700">Inativo</span>
                    )}
                    {group.isRequired && (
                      <span className="rounded-full bg-[var(--brand-orange)]/10 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--brand-orange-dark)]">Obrigatorio</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {group.options.length} opcao{group.options.length !== 1 ? "oes" : ""}
                    {group.minSelections > 0 && ` • Min: ${group.minSelections}`}
                    {group.maxSelections && ` • Max: ${group.maxSelections}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-full bg-[var(--brand-orange)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
                    onClick={() => openEditor(group)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                    onClick={() => void toggleActive(group)}
                    type="button"
                  >
                    {group.isActive ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    className="rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    disabled={deletingId === group.id}
                    onClick={() => {
                      if (window.confirm(`Excluir o grupo "${group.name}" e todas as suas opcoes?`)) {
                        void deleteGroup(group.id);
                      }
                    }}
                    type="button"
                  >
                    {deletingId === group.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>

              {group.options.length > 0 && (
                <div className="border-t border-[var(--line)] bg-[var(--background)]/50 px-5 py-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between rounded-[1.1rem] border border-[var(--line)] bg-white px-3 py-2.5 ${
                          !option.isActive ? "opacity-50" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{option.name}</p>
                          {option.description && (
                            <p className="text-xs text-[var(--muted)] truncate">{option.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 ml-2 text-right">
                          {asNumber(option.priceDelta) > 0 ? (
                            <span className="text-sm font-semibold text-[var(--brand-green-dark)]">
                              +{formatMoney(asNumber(option.priceDelta))}
                            </span>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">Gratis</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(30,18,8,0.58)] px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditor();
          }}
        >
          <div className="panel flex max-h-[min(92vh,980px)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-[var(--surface)] shadow-[0_24px_80px_rgba(28,16,6,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
              <div>
                <p className="eyebrow mb-2 text-[var(--muted)]">Editor</p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {editor.id ? "Editar grupo" : "Criar novo grupo"}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Defina o grupo e os ingredientes com preco. Depois vincule aos itens do cardapio.
                </p>
              </div>
              <button
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                onClick={closeEditor}
                type="button"
              >
                Fechar
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-[var(--muted)]">
                  Nome do grupo *
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                    onChange={(e) => setEditor((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Ex.: Adicionais de burger"
                    value={editor.name}
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  Slug (opcional)
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                    onChange={(e) => setEditor((c) => ({ ...c, slug: e.target.value }))}
                    placeholder="adicionais-burger"
                    value={editor.slug}
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm text-[var(--muted)]">
                Descricao
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                  onChange={(e) => setEditor((c) => ({ ...c, description: e.target.value }))}
                  placeholder="Escolha ate 3 adicionais para o seu burger"
                  value={editor.description}
                />
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <label className="text-sm text-[var(--muted)]">
                  Selecoes min.
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                    inputMode="numeric"
                    min="0"
                    onChange={(e) => setEditor((c) => ({ ...c, minSelections: e.target.value }))}
                    type="number"
                    value={editor.minSelections}
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  Selecoes max.
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                    inputMode="numeric"
                    min="1"
                    onChange={(e) => setEditor((c) => ({ ...c, maxSelections: e.target.value }))}
                    placeholder="Sem limite"
                    type="number"
                    value={editor.maxSelections}
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  Ordem
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                    inputMode="numeric"
                    min="0"
                    onChange={(e) => setEditor((c) => ({ ...c, sortOrder: e.target.value }))}
                    type="number"
                    value={editor.sortOrder}
                  />
                </label>
                <div className="flex flex-col justify-end gap-3 pt-1">
                  <label className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                    <input
                      checked={editor.isRequired}
                      onChange={(e) => setEditor((c) => ({ ...c, isRequired: e.target.checked }))}
                      type="checkbox"
                    />
                    Obrigatorio
                  </label>
                  <label className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                    <input
                      checked={editor.isActive}
                      onChange={(e) => setEditor((c) => ({ ...c, isActive: e.target.checked }))}
                      type="checkbox"
                    />
                    Ativo
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Ingredientes / opcoes
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {editor.items.length} item{editor.items.length !== 1 ? "s" : ""} • Soma dos adicionais: {formatMoney(totalDelta(editor.items))}
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                    onClick={addItem}
                    type="button"
                  >
                    + Adicionar
                  </button>
                </div>

                {editor.items.length === 0 && (
                  <div className="mt-4 rounded-[1.3rem] border border-dashed border-[var(--line)] bg-[var(--background)]/50 px-5 py-8 text-center">
                    <p className="text-sm text-[var(--muted)]">
                      Nenhum ingrediente ainda. Clique em &quot;+ Adicionar&quot; para comecar.
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {editor.items.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] p-4 sm:grid-cols-[minmax(0,1fr)_120px_80px_auto_auto]"
                    >
                      <label className="text-sm text-[var(--muted)]">
                        Nome *
                        <input
                          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--foreground)]"
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          placeholder="Ex.: Bacon extra"
                          value={item.name}
                        />
                      </label>
                      <label className="text-sm text-[var(--muted)]">
                        Preco (R$)
                        <input
                          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--foreground)]"
                          inputMode="decimal"
                          onChange={(e) => updateItem(index, "priceDelta", e.target.value)}
                          placeholder="0"
                          value={item.priceDelta}
                        />
                      </label>
                      <div className="flex flex-col justify-end gap-2 text-sm">
                        <label className="flex items-center gap-2 text-[var(--foreground)]">
                          <input
                            checked={item.isDefault}
                            onChange={(e) => updateItem(index, "isDefault", e.target.checked)}
                            type="checkbox"
                          />
                          Padrao
                        </label>
                        <label className="flex items-center gap-2 text-[var(--foreground)]">
                          <input
                            checked={item.isActive}
                            onChange={(e) => updateItem(index, "isActive", e.target.checked)}
                            type="checkbox"
                          />
                          Ativo
                        </label>
                      </div>
                      <button
                        className="mt-5 self-start rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        onClick={() => removeItem(index)}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--line)] px-6 py-5">
              <button
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                onClick={closeEditor}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:opacity-60"
                disabled={saving || !editor.name.trim()}
                onClick={() => void saveGroup()}
                type="button"
              >
                {saving ? "Salvando..." : editor.id ? "Salvar alteracoes" : "Criar grupo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}