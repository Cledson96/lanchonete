"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategoryEditorModal } from "./cardapio/category-editor-modal";
import { DeleteCategoryDialog } from "./cardapio/delete-category-dialog";
import {
  createEditorStateFromItem,
  createNewEditorState,
  emptyCategoryEditorState,
  normalizeItem,
} from "./cardapio/helpers";
import { PlusIcon } from "./cardapio/icons";
import { CategoriesPanel, ItemsPanel } from "./cardapio/items-panel";
import { ItemEditorModal } from "./cardapio/item-editor-modal";
import { TabButton } from "./cardapio/tab-button";
import type {
  CategoryEditorState,
  CategorySummary,
  DashboardCardapioManagerProps,
  DeleteCategoryState,
  EditorState,
  EditorTab,
  MainTab,
  MenuItemSummary,
  ToastState,
} from "./cardapio/types";

export function DashboardCardapioManager({
  categories,
  items,
  optionGroups,
  ingredients,
}: DashboardCardapioManagerProps) {
  const [categoryList, setCategoryList] = useState(categories);
  const [menuItems, setMenuItems] = useState(items.map(normalizeItem));
  const [editor, setEditor] = useState<EditorState>(() => createNewEditorState(categoryList));
  const [categoryEditor, setCategoryEditor] = useState<CategoryEditorState>(emptyCategoryEditorState);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [toast, setToast] = useState<ToastState>(null);
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("basic");
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [deleteCategoryState, setDeleteCategoryState] = useState<DeleteCategoryState>(null);
  const [mainTab, setMainTab] = useState<MainTab>("items");
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const refreshCatalog = useCallback(async () => {
    const [catRes, itemsRes] = await Promise.all([
      fetch("/api/menu/categories"),
      fetch("/api/menu/items"),
    ]);
    const [catJson, itemsJson] = await Promise.all([catRes.json(), itemsRes.json()]);
    if (catRes.ok && catJson.categories) setCategoryList(catJson.categories);
    if (itemsRes.ok && itemsJson.items) setMenuItems(itemsJson.items.map(normalizeItem));
  }, []);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (selectedCategory !== "all" && item.category.id !== selectedCategory) return false;
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;
      if (!q) return true;
      const haystack = `${item.name} ${item.category.name} ${item.description || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [menuItems, search, selectedCategory, statusFilter]);

  const categoryItemCounts = useMemo(
    () =>
      categoryList.map((category) => ({
        ...category,
        itemCount: menuItems.filter((i) => i.category.id === category.id).length,
      })),
    [categoryList, menuItems]
  );

  const componentCandidates = useMemo(
    () => menuItems.filter((i) => i.id !== editor.id).sort((a, b) => a.name.localeCompare(b.name)),
    [editor.id, menuItems]
  );

  useEffect(() => {
    if (selectedCategory !== "all" && !categoryList.some((c) => c.id === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categoryList, selectedCategory]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function openEditor(itemId: string | null) {
    setEditorTab("basic");
    if (!itemId) {
      setSelectedItemId(null);
      setEditor(createNewEditorState(categoryList));
      setIsEditorOpen(true);
      return;
    }
    const item = menuItems.find((e) => e.id === itemId);
    if (!item) return;
    setSelectedItemId(item.id);
    setEditor(createEditorStateFromItem(item));
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

  function openCategoryEditor(category?: CategorySummary) {
    setCategoryEditor(
      category
        ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            sortOrder: String(category.sortOrder ?? 0),
            availableFrom: category.availableFrom || "",
            availableUntil: category.availableUntil || "",
            isActive: category.isActive,
          }
        : emptyCategoryEditorState
    );
    setIsCategoryEditorOpen(true);
  }

  function openDeleteCategoryDialog(category: CategorySummary & { itemCount: number }) {
    const moveTarget = categoryList.find((e) => e.id !== category.id);
    setDeleteCategoryState({
      id: category.id,
      name: category.name,
      itemCount: category.itemCount,
      strategy: category.itemCount > 0 ? "move_items" : "delete_items",
      targetCategoryId: moveTarget?.id || "",
    });
  }

  function updateLocalItem(rawItem: MenuItemSummary) {
    const normalized = normalizeItem(rawItem);
    setMenuItems((current) => {
      const idx = current.findIndex((i) => i.id === normalized.id);
      if (idx === -1) return [...current, normalized].sort((a, b) => a.name.localeCompare(b.name));
      return current.map((i) => (i.id === normalized.id ? normalized : i));
    });
    setSelectedItemId(normalized.id);
    setEditor(createEditorStateFromItem(normalized));
  }

  function toggleOptionGroup(id: string) {
    setEditor((c) => ({
      ...c,
      optionGroupIds: c.optionGroupIds.includes(id)
        ? c.optionGroupIds.filter((x) => x !== id)
        : [...c.optionGroupIds, id],
    }));
  }

  function toggleIngredient(id: string) {
    setEditor((c) => ({
      ...c,
      ingredientIds: c.ingredientIds.includes(id)
        ? c.ingredientIds.filter((x) => x !== id)
        : [...c.ingredientIds, id],
    }));
  }

  function toggleComboComponent(id: string) {
    setEditor((c) => {
      const exists = c.comboComponents.some((x) => x.componentMenuItemId === id);
      return {
        ...c,
        comboComponents: exists
          ? c.comboComponents.filter((x) => x.componentMenuItemId !== id)
          : [...c.comboComponents, { componentMenuItemId: id, quantity: "1" }],
      };
    });
  }

  function updateComboComponentQuantity(id: string, quantity: string) {
    setEditor((c) => ({
      ...c,
      comboComponents: c.comboComponents.map((x) =>
        x.componentMenuItemId === id ? { ...x, quantity } : x
      ),
    }));
  }

  async function saveItem() {
    try {
      setSaving(true);
      setToast(null);
      const payload = {
        ...(editor.id ? { id: editor.id } : {}),
        categoryId: editor.categoryId,
        name: editor.name,
        slug: editor.slug || undefined,
        description: editor.ingredients || undefined,
        kind: editor.kind,
        price: Number(editor.price),
        compareAtPrice: editor.compareAtPrice ? Number(editor.compareAtPrice) : undefined,
        isActive: editor.isActive,
        isFeatured: editor.isFeatured,
        sortOrder: Number(editor.sortOrder || 0),
        availableWeekdays: editor.availableWeekdays,
        optionGroupIds: editor.optionGroupIds,
        ingredientIds: editor.ingredientIds,
        comboComponents:
          editor.kind === "combo"
            ? editor.comboComponents.map((c) => ({
                componentMenuItemId: c.componentMenuItemId,
                quantity: Number(c.quantity || 1),
              }))
            : [],
      };
      const response = await fetch("/api/menu/items", {
        method: editor.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message || "Não foi possível salvar o item.");
      updateLocalItem(json.item);
      setToast({
        tone: "success",
        message: editor.id ? "Item atualizado com sucesso." : "Item criado com sucesso.",
      });
      setIsEditorOpen(false);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Não foi possível salvar o item.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory() {
    try {
      setSavingCategory(true);
      setToast(null);
      const payload = {
        ...(categoryEditor.id ? { id: categoryEditor.id } : {}),
        name: categoryEditor.name,
        slug: categoryEditor.slug || undefined,
        description: categoryEditor.description || undefined,
        sortOrder: Number(categoryEditor.sortOrder || 0),
        availableFrom: categoryEditor.availableFrom || undefined,
        availableUntil: categoryEditor.availableUntil || undefined,
        isActive: categoryEditor.isActive,
      };
      const response = await fetch("/api/menu/categories", {
        method: categoryEditor.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json?.error?.message || "Não foi possível salvar a categoria.");
      await refreshCatalog();
      setToast({
        tone: "success",
        message: categoryEditor.id ? "Categoria atualizada." : "Categoria criada.",
      });
      setIsCategoryEditorOpen(false);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Não foi possível salvar a categoria.",
      });
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory() {
    if (!deleteCategoryState) return;
    try {
      setDeletingCategory(true);
      setToast(null);
      const response = await fetch("/api/menu/categories", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: deleteCategoryState.id,
          strategy: deleteCategoryState.strategy,
          targetCategoryId:
            deleteCategoryState.strategy === "move_items"
              ? deleteCategoryState.targetCategoryId
              : undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        const details = json?.error?.details as { blockedItems?: Array<{ name: string }> } | undefined;
        if (details?.blockedItems?.length) {
          throw new Error(
            `${json?.error?.message || "Não foi possível excluir."} Itens bloqueados: ${details.blockedItems
              .map((i) => i.name)
              .join(", ")}.`
          );
        }
        throw new Error(json?.error?.message || "Não foi possível excluir a categoria.");
      }
      await refreshCatalog();
      setToast({
        tone: "success",
        message:
          deleteCategoryState.strategy === "move_items"
            ? "Categoria excluída e itens movidos."
            : "Categoria excluída.",
      });
      setDeleteCategoryState(null);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Não foi possível excluir a categoria.",
      });
    } finally {
      setDeletingCategory(false);
    }
  }

  async function toggleActive(item: ReturnType<typeof normalizeItem>) {
    try {
      setToast(null);
      const response = await fetch("/api/menu/items", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json?.error?.message || "Não foi possível atualizar o item.");
      updateLocalItem(json.item);
      setToast({ tone: "success", message: item.isActive ? "Item desativado." : "Item ativado." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Não foi possível atualizar o item.",
      });
    }
  }

  async function handleUpload(itemId: string, file: File | null) {
    if (!file) return;
    try {
      setToast(null);
      setUploadingItemId(itemId);
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("file", file);
      const response = await fetch("/api/menu/items/image", { method: "POST", body: formData });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message || "Não foi possível enviar a imagem.");
      setMenuItems((c) => c.map((i) => (i.id === itemId ? { ...i, imageUrl: json.item.imageUrl } : i)));
      setToast({ tone: "success", message: "Imagem atualizada." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Não foi possível enviar a imagem.",
      });
    } finally {
      setUploadingItemId(null);
      const input = fileInputsRef.current[itemId];
      if (input) input.value = "";
    }
  }

  async function handleRemoveImage(itemId: string) {
    try {
      setToast(null);
      setRemovingItemId(itemId);
      const response = await fetch("/api/menu/items/image", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message || "Não foi possível remover a imagem.");
      setMenuItems((c) => c.map((i) => (i.id === itemId ? { ...i, imageUrl: null } : i)));
      setToast({ tone: "success", message: "Imagem removida." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Não foi possível remover a imagem.",
      });
    } finally {
      setRemovingItemId(null);
    }
  }

  const imageCount = menuItems.filter((i) => i.imageUrl).length;
  const comboCount = menuItems.filter((i) => i.kind === "combo").length;
  const activeCount = menuItems.filter((i) => i.isActive).length;

  return (
    <main className="space-y-4 text-[var(--foreground)]">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-[var(--muted)]">Catálogo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Cardápio</h1>
          <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
            {menuItems.length} itens · {activeCount} ativos · {comboCount} combos · {imageCount} com imagem
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/5"
            onClick={() => openCategoryEditor()}
            type="button"
          >
            <PlusIcon />
            Nova categoria
          </button>
          <button
            className="flex items-center gap-1.5 rounded-full bg-[var(--brand-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
            onClick={() => openEditor(null)}
            type="button"
          >
            <PlusIcon />
            Novo item
          </button>
        </div>
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

      <div className="flex gap-1 border-b border-[var(--line)]">
        <TabButton active={mainTab === "items"} onClick={() => setMainTab("items")}>
          Itens
          <span className="ml-1.5 rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[0.65rem] font-bold text-[var(--muted)]">
            {menuItems.length}
          </span>
        </TabButton>
        <TabButton active={mainTab === "categories"} onClick={() => setMainTab("categories")}>
          Categorias
          <span className="ml-1.5 rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[0.65rem] font-bold text-[var(--muted)]">
            {categoryList.length}
          </span>
        </TabButton>
      </div>

      {mainTab === "items" ? (
        <ItemsPanel
          categoryList={categoryList}
          fileInputsRef={fileInputsRef}
          items={visibleItems}
          onEditItem={openEditor}
          onRemoveImage={handleRemoveImage}
          onSearchChange={setSearch}
          onSelectedCategoryChange={setSelectedCategory}
          onStatusFilterChange={setStatusFilter}
          onToggleActive={toggleActive}
          onUpload={handleUpload}
          removingItemId={removingItemId}
          search={search}
          selectedCategory={selectedCategory}
          statusFilter={statusFilter}
          totalItems={menuItems.length}
          uploadingItemId={uploadingItemId}
        />
      ) : (
        <CategoriesPanel
          categories={categoryItemCounts}
          onDelete={openDeleteCategoryDialog}
          onEdit={openCategoryEditor}
        />
      )}

      {isEditorOpen ? (
        <ItemEditorModal
          categoryList={categoryList}
          componentCandidates={componentCandidates}
          editor={editor}
          ingredients={ingredients}
          isEditingExisting={Boolean(selectedItemId)}
          onClose={closeEditor}
          onCreateNew={() => openEditor(null)}
          onSave={saveItem}
          onSetEditor={setEditor}
          onTabChange={setEditorTab}
          onToggleComboComponent={toggleComboComponent}
          onToggleIngredient={toggleIngredient}
          onToggleOptionGroup={toggleOptionGroup}
          onUpdateComboQuantity={updateComboComponentQuantity}
          optionGroups={optionGroups}
          saving={saving}
          tab={editorTab}
        />
      ) : null}

      {isCategoryEditorOpen ? (
        <CategoryEditorModal
          editor={categoryEditor}
          onClose={() => setIsCategoryEditorOpen(false)}
          onSave={saveCategory}
          onSetEditor={setCategoryEditor}
          saving={savingCategory}
        />
      ) : null}

      {deleteCategoryState ? (
        <DeleteCategoryDialog
          categoryList={categoryList}
          deleting={deletingCategory}
          onClose={() => setDeleteCategoryState(null)}
          onConfirm={deleteCategory}
          onSetState={setDeleteCategoryState}
          state={deleteCategoryState}
        />
      ) : null}
    </main>
  );
}
