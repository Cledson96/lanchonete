"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MENU_WEEKDAYS, formatMenuWeekdays } from "@/lib/menu-item-availability";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { formatMoney } from "@/lib/utils";

/* ═══════════════════════════════════════════════
   Types
═══════════════════════════════════════════════ */

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  availableFrom: string | null;
  availableUntil: string | null;
  isActive: boolean;
};

type OptionGroupSummary = { id: string; name: string };

type IngredientSummary = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type ComboComponentSummary = {
  quantity: number;
  componentMenuItem: { id: string; name: string; category: { id: string; name: string } };
};

type MenuItemSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  kind: "simples" | "combo";
  price: number | string | { toString(): string };
  compareAtPrice?: number | string | { toString(): string } | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  category: { id: string; name: string };
  availableWeekdays?: string[];
  optionGroups: Array<{ optionGroup: { id: string; name: string } }>;
  ingredients: Array<{ ingredient: { id: string; name: string } }>;
  comboItems?: ComboComponentSummary[];
};

type Props = {
  categories: CategorySummary[];
  items: MenuItemSummary[];
  optionGroups: OptionGroupSummary[];
  ingredients: IngredientSummary[];
};

type ToastState = { tone: "success" | "error"; message: string } | null;

type CategoryEditorState = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  sortOrder: string;
  availableFrom: string;
  availableUntil: string;
  isActive: boolean;
};

type DeleteCategoryState = {
  id: string;
  name: string;
  itemCount: number;
  strategy: "delete_items" | "move_items";
  targetCategoryId: string;
} | null;

type EditorState = {
  id: string | null;
  categoryId: string;
  name: string;
  slug: string;
  ingredients: string;
  kind: "simples" | "combo";
  price: string;
  compareAtPrice: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: string;
  availableWeekdays: string[];
  optionGroupIds: string[];
  ingredientIds: string[];
  comboComponents: Array<{ componentMenuItemId: string; quantity: string }>;
};

type MainTab = "items" | "categories";
type EditorTab = "basic" | "options" | "ingredients" | "combo";

/* ═══════════════════════════════════════════════
   Constants & helpers
═══════════════════════════════════════════════ */

const emptyEditorState: EditorState = {
  id: null,
  categoryId: "",
  name: "",
  slug: "",
  ingredients: "",
  kind: "simples",
  price: "",
  compareAtPrice: "",
  isActive: true,
  isFeatured: false,
  sortOrder: "0",
  availableWeekdays: [],
  optionGroupIds: [],
  ingredientIds: [],
  comboComponents: [],
};

const emptyCategoryEditorState: CategoryEditorState = {
  id: null,
  name: "",
  slug: "",
  description: "",
  sortOrder: "0",
  availableFrom: "",
  availableUntil: "",
  isActive: true,
};

function asNumber(value: MenuItemSummary["price"] | MenuItemSummary["compareAtPrice"]) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value.toString());
}

function normalizeItem(item: MenuItemSummary) {
  return {
    ...item,
    price: asNumber(item.price) ?? 0,
    compareAtPrice: asNumber(item.compareAtPrice),
    optionGroups: item.optionGroups || [],
    ingredients: item.ingredients || [],
    comboItems: item.comboItems || [],
  };
}

function createEditorStateFromItem(item: ReturnType<typeof normalizeItem>): EditorState {
  return {
    id: item.id,
    categoryId: item.category.id,
    name: item.name,
    slug: item.slug,
    ingredients: item.description || "",
    kind: item.kind,
    price: String(item.price),
    compareAtPrice: item.compareAtPrice != null ? String(item.compareAtPrice) : "",
    isActive: item.isActive,
    isFeatured: item.isFeatured,
    sortOrder: String(item.sortOrder ?? 0),
    availableWeekdays: item.availableWeekdays || [],
    optionGroupIds: (item.optionGroups || []).map((g) => g.optionGroup.id),
    ingredientIds: (item.ingredients || []).map((l) => l.ingredient.id),
    comboComponents: (item.comboItems || []).map((c) => ({
      componentMenuItemId: c.componentMenuItem.id,
      quantity: String(c.quantity),
    })),
  };
}

function createNewEditorState(categories: CategorySummary[]): EditorState {
  return { ...emptyEditorState, categoryId: categories[0]?.id || "" };
}

function toggleWeekday(list: string[], weekday: string) {
  return list.includes(weekday) ? list.filter((i) => i !== weekday) : [...list, weekday];
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

function ImageIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════ */

export function DashboardCardapioManager({ categories, items, optionGroups, ingredients }: Props) {
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

  /* ── Editor handlers ── */

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

  /* ── Async actions ── */

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

  /* ═══════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════ */

  const imageCount = menuItems.filter((i) => i.imageUrl).length;
  const comboCount = menuItems.filter((i) => i.kind === "combo").length;
  const activeCount = menuItems.filter((i) => i.isActive).length;

  return (
    <main className="space-y-4 text-[var(--foreground)]">
      {/* ─── Header compacto ─── */}
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

      {/* ─── Tabs principais ─── */}
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

      {/* ─── Conteúdo das tabs ─── */}
      {mainTab === "items" ? (
        <ItemsPanel
          categoryList={categoryList}
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
          fileInputsRef={fileInputsRef}
        />
      ) : (
        <CategoriesPanel
          categories={categoryItemCounts}
          onDelete={openDeleteCategoryDialog}
          onEdit={openCategoryEditor}
        />
      )}

      {/* ─── Modais ─── */}
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

/* ═══════════════════════════════════════════════
   Subcomponents — Tab button
═══════════════════════════════════════════════ */

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`relative flex items-center px-4 py-2.5 text-sm font-semibold transition ${
        active ? "text-[var(--brand-orange-dark)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[var(--brand-orange)]" />
      ) : null}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   Items panel
═══════════════════════════════════════════════ */

type ItemsPanelProps = {
  categoryList: CategorySummary[];
  items: ReturnType<typeof normalizeItem>[];
  onEditItem: (id: string | null) => void;
  onRemoveImage: (id: string) => Promise<void>;
  onSearchChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "active" | "inactive") => void;
  onToggleActive: (item: ReturnType<typeof normalizeItem>) => Promise<void>;
  onUpload: (id: string, file: File | null) => Promise<void>;
  removingItemId: string | null;
  search: string;
  selectedCategory: string;
  statusFilter: "all" | "active" | "inactive";
  totalItems: number;
  uploadingItemId: string | null;
  fileInputsRef: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
};

function ItemsPanel({
  categoryList,
  items,
  onEditItem,
  onRemoveImage,
  onSearchChange,
  onSelectedCategoryChange,
  onStatusFilterChange,
  onToggleActive,
  onUpload,
  removingItemId,
  search,
  selectedCategory,
  statusFilter,
  totalItems,
  uploadingItemId,
  fileInputsRef,
}: ItemsPanelProps) {
  return (
    <section className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <SearchIcon />
          </span>
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--brand-orange)]"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, categoria ou descrição…"
            value={search}
          />
        </div>
        <select
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-orange)]"
          onChange={(e) => onSelectedCategoryChange(e.target.value)}
          value={selectedCategory}
        >
          <option value="all">Todas as categorias</option>
          {categoryList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-xl border border-[var(--line)]">
          {(["all", "active", "inactive"] as const).map((value) => (
            <button
              key={value}
              className={`px-3 py-2 text-xs font-semibold transition ${
                statusFilter === value
                  ? "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                  : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => onStatusFilterChange(value)}
              type="button"
            >
              {value === "all" ? "Todos" : value === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de itens */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center text-sm text-[var(--muted)]">
          {totalItems === 0
            ? "Nenhum item cadastrado. Clique em 'Novo item' para começar."
            : "Nenhum item bate com os filtros. Ajuste a busca ou categoria."}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              fileInputsRef={fileInputsRef}
              item={item}
              onEdit={() => onEditItem(item.id)}
              onRemoveImage={() => void onRemoveImage(item.id)}
              onToggleActive={() => void onToggleActive(item)}
              onUpload={(file) => void onUpload(item.id, file)}
              removing={removingItemId === item.id}
              uploading={uploadingItemId === item.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════
   Item card — compacto
═══════════════════════════════════════════════ */

type ItemCardProps = {
  fileInputsRef: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  item: ReturnType<typeof normalizeItem>;
  onEdit: () => void;
  onRemoveImage: () => void;
  onToggleActive: () => void;
  onUpload: (file: File | null) => void;
  removing: boolean;
  uploading: boolean;
};

function ItemCard({
  fileInputsRef,
  item,
  onEdit,
  onRemoveImage,
  onToggleActive,
  onUpload,
  removing,
  uploading,
}: ItemCardProps) {
  const price = asNumber(item.price) ?? 0;
  const comparePrice = asNumber(item.compareAtPrice);
  const optionCount = (item.optionGroups || []).length;
  const comboCount = (item.comboItems || []).length;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-sm transition hover:border-[var(--brand-orange)]/40 hover:shadow-md ${
        item.isActive ? "border-[var(--line)]" : "border-[var(--line)] opacity-75"
      }`}
    >
      {/* Imagem */}
      <div className="relative h-36 w-full bg-[var(--background)]">
        {item.imageUrl ? (
          <Image alt={item.name} className="object-cover" fill sizes="320px" src={resolveMenuItemImage(item.imageUrl)} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
            <ImageIcon />
            <span className="ml-1">Sem imagem</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--foreground)]">
            {item.category.name}
          </span>
          {item.kind === "combo" ? (
            <span className="rounded-full bg-[var(--brand-orange)] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
              combo
            </span>
          ) : null}
        </div>
        {!item.isActive || item.isFeatured || item.availableWeekdays?.length ? (
          <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-1">
            {!item.isActive ? (
              <span className="rounded-full bg-red-500/95 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-white">
                Inativo
              </span>
            ) : null}
            {item.isFeatured ? (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-amber-900">
                Destaque
              </span>
            ) : null}
            {item.availableWeekdays?.length ? (
              <span className="rounded-full bg-[var(--brand-green)] px-2 py-0.5 text-[0.6rem] font-bold uppercase text-white">
                {formatMenuWeekdays(item.availableWeekdays)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Corpo */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-tight">{item.name}</h3>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-[var(--brand-orange-dark)]">{formatMoney(price)}</p>
            {comparePrice ? (
              <p className="text-[0.65rem] text-[var(--muted)] line-through">{formatMoney(comparePrice)}</p>
            ) : null}
          </div>
        </div>

        {item.description ? (
          <p className="line-clamp-2 text-xs leading-5 text-[var(--muted)]">{item.description}</p>
        ) : null}

        {optionCount > 0 || comboCount > 0 ? (
          <div className="flex flex-wrap gap-1">
            {optionCount > 0 ? (
              <span className="rounded-md bg-[var(--brand-green)]/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-[var(--brand-green-dark)]">
                {optionCount} {optionCount === 1 ? "grupo" : "grupos"} de opcionais
              </span>
            ) : null}
            {comboCount > 0 ? (
              <span className="rounded-md bg-[var(--brand-orange)]/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-[var(--brand-orange-dark)]">
                {comboCount} {comboCount === 1 ? "item" : "itens"} no combo
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Ações */}
        <div className="mt-auto flex items-center gap-1 border-t border-[var(--line)] pt-2">
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
            title={item.isActive ? "Desativar" : "Ativar"}
            type="button"
          >
            {item.isActive ? "Pausar" : "Ativar"}
          </button>
          <label
            className="flex cursor-pointer items-center justify-center rounded-lg border border-[var(--line)] p-1.5 text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
            title={item.imageUrl ? "Trocar imagem" : "Enviar imagem"}
          >
            {uploading ? (
              <span className="px-1 text-[0.6rem]">…</span>
            ) : (
              <ImageIcon />
            )}
            <input
              accept="image/*"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0] || null)}
              ref={(node) => {
                fileInputsRef.current[item.id] = node;
              }}
              type="file"
            />
          </label>
          {item.imageUrl ? (
            <button
              className="rounded-lg border border-[var(--line)] p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              disabled={removing}
              onClick={onRemoveImage}
              title="Remover imagem"
              type="button"
            >
              <TrashIcon />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════
   Categories panel
═══════════════════════════════════════════════ */

function CategoriesPanel({
  categories,
  onDelete,
  onEdit,
}: {
  categories: Array<CategorySummary & { itemCount: number }>;
  onDelete: (c: CategorySummary & { itemCount: number }) => void;
  onEdit: (c?: CategorySummary) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center text-sm text-[var(--muted)]">
        Nenhuma categoria cadastrada. Clique em &quot;Nova categoria&quot; para começar.
      </div>
    );
  }

  return (
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <article
          className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition hover:border-[var(--brand-orange)]/40"
          key={category.id}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-bold leading-tight">{category.name}</h3>
                {!category.isActive ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[0.6rem] font-bold text-red-700">
                    Inativa
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">/{category.slug}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--brand-orange)]/10 px-2 py-0.5 text-[0.65rem] font-bold text-[var(--brand-orange-dark)]">
              {category.itemCount} {category.itemCount === 1 ? "item" : "itens"}
            </span>
          </div>

          {category.description ? (
            <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">{category.description}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] text-[var(--muted)]">
            <span>Ordem {category.sortOrder}</span>
            {category.availableFrom || category.availableUntil ? (
              <span>
                · {category.availableFrom || "00:00"}–{category.availableUntil || "23:59"}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex gap-1.5 border-t border-[var(--line)] pt-3">
            <button
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--line)] px-2 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
              onClick={() => onEdit(category)}
              type="button"
            >
              <EditIcon />
              Editar
            </button>
            <button
              className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
              onClick={() => onDelete(category)}
              type="button"
            >
              <TrashIcon />
              Excluir
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

/* ═══════════════════════════════════════════════
   Item editor modal — com tabs internas
═══════════════════════════════════════════════ */

type ItemEditorModalProps = {
  categoryList: CategorySummary[];
  componentCandidates: ReturnType<typeof normalizeItem>[];
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

function ItemEditorModal({
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
              {isEditingExisting ? "Editando item" : "Novo item"}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-bold leading-tight">
              {editor.name.trim() || "Sem nome"}
            </h2>
          </div>
          <div className="flex gap-1.5">
            {isEditingExisting ? (
              <button
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--background)]"
                onClick={onCreateNew}
                type="button"
              >
                Novo
              </button>
            ) : null}
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
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 border-b border-[var(--line)] px-5">
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
                <span className="ml-1.5 rounded-full bg-[var(--brand-orange)]/15 px-1.5 py-0.5 text-[0.6rem] font-bold text-[var(--brand-orange-dark)]">
                  {t.hint}
                </span>
              ) : null}
              {tab === t.id ? (
                <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[var(--brand-orange)]" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
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
            disabled={saving || !editor.name.trim() || !editor.price}
            onClick={() => void onSave()}
            type="button"
          >
            {saving ? "Salvando…" : isEditingExisting ? "Salvar alterações" : "Criar item"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Básico ── */

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
            <p className="text-xs font-bold">Dias disponíveis</p>
            <p className="text-[0.65rem] text-[var(--muted)]">Vazio = todos os dias</p>
          </div>
          <button
            className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--muted)] transition hover:bg-[var(--background)]"
            onClick={() => onSetEditor((c) => ({ ...c, availableWeekdays: [] }))}
            type="button"
          >
            Todos os dias
          </button>
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

/* ── Tab: Opcionais ── */

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
    () =>
      optionGroups.filter((g) => g.name.toLowerCase().includes(filter.trim().toLowerCase())),
    [optionGroups, filter]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted)]">
        Selecione os grupos de adicionais que aparecem ao cliente (bebidas, molhos, bordas etc).
      </p>
      {optionGroups.length > 6 ? (
        <input
          className="input"
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar grupo…"
          value={filter}
        />
      ) : null}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-8 text-center text-xs text-[var(--muted)]">
          {optionGroups.length === 0 ? "Nenhum grupo cadastrado." : "Nenhum grupo bate com a busca."}
        </div>
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

/* ── Tab: Ingredientes ── */

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
    () =>
      ingredients.filter((i) => i.name.toLowerCase().includes(filter.trim().toLowerCase())),
    [ingredients, filter]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted)]">
        Ingredientes que compõem o item. O cliente poderá remover ou pedir adicional no pedido.
      </p>
      {ingredients.length > 8 ? (
        <input
          className="input"
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar ingrediente…"
          value={filter}
        />
      ) : null}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-8 text-center text-xs text-[var(--muted)]">
          {ingredients.length === 0 ? "Nenhum ingrediente cadastrado." : "Nenhum ingrediente bate com a busca."}
        </div>
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

/* ── Tab: Combo ── */

function ComboTab({
  candidates,
  editor,
  onToggle,
  onUpdateQuantity,
}: {
  candidates: ReturnType<typeof normalizeItem>[];
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
        <button
          className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
            onlySelected
              ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
              : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => setOnlySelected(!onlySelected)}
          type="button"
        >
          Apenas selecionados ({editor.comboComponents.length})
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-8 text-center text-xs text-[var(--muted)]">
          Nenhum item bate com os filtros.
        </div>
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

/* ═══════════════════════════════════════════════
   Category editor modal
═══════════════════════════════════════════════ */

function CategoryEditorModal({
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

/* ═══════════════════════════════════════════════
   Delete category dialog
═══════════════════════════════════════════════ */

function DeleteCategoryDialog({
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
            disabled={
              deleting || (state.strategy === "move_items" && !state.targetCategoryId)
            }
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

/* ═══════════════════════════════════════════════
   Shared field primitives
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
