"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MENU_WEEKDAYS, formatMenuWeekdays } from "@/lib/menu-item-availability";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { formatMoney } from "@/lib/utils";

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

type OptionGroupSummary = {
  id: string;
  name: string;
};

type IngredientSummary = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type ComboComponentSummary = {
  quantity: number;
  componentMenuItem: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
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
  category: {
    id: string;
    name: string;
  };
  availableWeekdays?: string[];
  optionGroups: Array<{
    optionGroup: {
      id: string;
      name: string;
    };
  }>;
  ingredients: Array<{
    ingredient: {
      id: string;
      name: string;
    };
  }>;
  comboItems?: ComboComponentSummary[];
};

type Props = {
  categories: CategorySummary[];
  items: MenuItemSummary[];
  optionGroups: OptionGroupSummary[];
  ingredients: IngredientSummary[];
};

type ToastState = {
  tone: "success" | "error";
  message: string;
} | null;

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
  comboComponents: Array<{
    componentMenuItemId: string;
    quantity: string;
  }>;
};

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
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

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
    optionGroupIds: (item.optionGroups || []).map((group) => group.optionGroup.id),
    ingredientIds: (item.ingredients || []).map((link) => link.ingredient.id),
    comboComponents: (item.comboItems || []).map((component) => ({
      componentMenuItemId: component.componentMenuItem.id,
      quantity: String(component.quantity),
    })),
  };
}

function createNewEditorState(categories: CategorySummary[]) {
  return {
    ...emptyEditorState,
    categoryId: categories[0]?.id || "",
    } satisfies EditorState;
}

function toggleWeekday(list: string[], weekday: string) {
  return list.includes(weekday) ? list.filter((item) => item !== weekday) : [...list, weekday];
}

export function DashboardCardapioManager({ categories, items, optionGroups, ingredients }: Props) {
  const [categoryList, setCategoryList] = useState(categories);
  const [menuItems, setMenuItems] = useState(items.map(normalizeItem));
  const [editor, setEditor] = useState<EditorState>(() => createNewEditorState(categoryList));
  const [categoryEditor, setCategoryEditor] = useState<CategoryEditorState>(emptyCategoryEditorState);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toast, setToast] = useState<ToastState>(null);
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [deleteCategoryState, setDeleteCategoryState] = useState<DeleteCategoryState>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const refreshCatalog = useCallback(async () => {
    const [categoriesResponse, itemsResponse] = await Promise.all([
      fetch("/api/menu/categories"),
      fetch("/api/menu/items"),
    ]);

    const [categoriesJson, itemsJson] = await Promise.all([
      categoriesResponse.json(),
      itemsResponse.json(),
    ]);

    if (categoriesResponse.ok && categoriesJson.categories) {
      setCategoryList(categoriesJson.categories);
    }

    if (itemsResponse.ok && itemsJson.items) {
      setMenuItems(itemsJson.items.map(normalizeItem));
    }
  }, []);

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category.id === selectedCategory;
      const haystack = `${item.name} ${item.category.name} ${item.description || ""}`.toLowerCase();
      return matchesCategory && haystack.includes(search.trim().toLowerCase());
    });
  }, [menuItems, search, selectedCategory]);

  const categoryItemCounts = useMemo(() => {
    return categoryList.map((category) => ({
      ...category,
      itemCount: menuItems.filter((item) => item.category.id === category.id).length,
    }));
  }, [categoryList, menuItems]);

  const componentCandidates = useMemo(() => {
    return menuItems.filter((item) => item.id !== editor.id).sort((a, b) => a.name.localeCompare(b.name));
  }, [editor.id, menuItems]);

  const imageCount = menuItems.filter((item) => item.imageUrl).length;
  const comboCount = menuItems.filter((item) => item.kind === "combo").length;

  useEffect(() => {
    if (selectedCategory !== "all" && !categoryList.some((category) => category.id === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categoryList, selectedCategory]);

  function openEditor(itemId: string | null) {
    if (!itemId) {
      setSelectedItemId(null);
      setEditor(createNewEditorState(categoryList));
      setIsEditorOpen(true);
      return;
    }

    const item = menuItems.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

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
        : emptyCategoryEditorState,
    );
    setIsCategoryEditorOpen(true);
  }

  function closeCategoryEditor() {
    setIsCategoryEditorOpen(false);
  }

  function openDeleteCategoryDialog(category: CategorySummary & { itemCount: number }) {
    const moveTarget = categoryList.find((entry) => entry.id !== category.id);

    setDeleteCategoryState({
      id: category.id,
      name: category.name,
      itemCount: category.itemCount,
      strategy: category.itemCount > 0 ? "move_items" : "delete_items",
      targetCategoryId: moveTarget?.id || "",
    });
  }

  function closeDeleteCategoryDialog() {
    setDeleteCategoryState(null);
  }

  function updateLocalItem(rawItem: MenuItemSummary) {
    const normalized = normalizeItem(rawItem);

    setMenuItems((current) => {
      const existingIndex = current.findIndex((item) => item.id === normalized.id);
      if (existingIndex === -1) {
        return [...current, normalized].sort((left, right) => left.name.localeCompare(right.name));
      }

      return current.map((item) => (item.id === normalized.id ? normalized : item));
    });

    setSelectedItemId(normalized.id);
    setEditor(createEditorStateFromItem(normalized));
  }

  function toggleOptionGroup(optionGroupId: string) {
    setEditor((current) => ({
      ...current,
      optionGroupIds: current.optionGroupIds.includes(optionGroupId)
        ? current.optionGroupIds.filter((id) => id !== optionGroupId)
        : [...current.optionGroupIds, optionGroupId],
    }));
  }

  function toggleIngredient(ingredientId: string) {
    setEditor((current) => ({
      ...current,
      ingredientIds: current.ingredientIds.includes(ingredientId)
        ? current.ingredientIds.filter((id) => id !== ingredientId)
        : [...current.ingredientIds, ingredientId],
    }));
  }

  function toggleComboComponent(componentMenuItemId: string) {
    setEditor((current) => {
      const exists = current.comboComponents.some(
        (component) => component.componentMenuItemId === componentMenuItemId,
      );

      return {
        ...current,
        comboComponents: exists
          ? current.comboComponents.filter(
              (component) => component.componentMenuItemId !== componentMenuItemId,
            )
          : [...current.comboComponents, { componentMenuItemId, quantity: "1" }],
      };
    });
  }

  function updateComboComponentQuantity(componentMenuItemId: string, quantity: string) {
    setEditor((current) => ({
      ...current,
      comboComponents: current.comboComponents.map((component) =>
        component.componentMenuItemId === componentMenuItemId
          ? {
              ...component,
              quantity,
            }
          : component,
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
            ? editor.comboComponents.map((component) => ({
                componentMenuItemId: component.componentMenuItemId,
                quantity: Number(component.quantity || 1),
              }))
            : [],
      };

      const response = await fetch("/api/menu/items", {
        method: editor.id ? "PATCH" : "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message || "Nao foi possivel salvar o item.");
      }

      updateLocalItem(json.item);
      setToast({
        tone: "success",
        message: editor.id ? "Item atualizado com sucesso." : "Item criado com sucesso.",
      });
      setIsEditorOpen(false);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar o item.",
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
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message || "Nao foi possivel salvar a categoria.");
      }

      await refreshCatalog();
      setToast({
        tone: "success",
        message: categoryEditor.id ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso.",
      });
      closeCategoryEditor();
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar a categoria.",
      });
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory() {
    if (!deleteCategoryState) {
      return;
    }

    try {
      setDeletingCategory(true);
      setToast(null);
      const response = await fetch("/api/menu/categories", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: deleteCategoryState.id,
          strategy: deleteCategoryState.strategy,
          targetCategoryId: deleteCategoryState.strategy === "move_items" ? deleteCategoryState.targetCategoryId : undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        const details = json?.error?.details as { blockedItems?: Array<{ name: string }> } | undefined;
        if (details?.blockedItems?.length) {
          throw new Error(
            `${json?.error?.message || "Nao foi possivel excluir."} Itens bloqueados: ${details.blockedItems.map((item) => item.name).join(", ")}.`,
          );
        }

        throw new Error(json?.error?.message || "Nao foi possivel excluir a categoria.");
      }

      await refreshCatalog();
      setToast({
        tone: "success",
        message:
          deleteCategoryState.strategy === "move_items"
            ? "Categoria excluida e itens movidos com sucesso."
            : "Categoria excluida com sucesso.",
      });
      closeDeleteCategoryDialog();
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel excluir a categoria.",
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
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message || "Nao foi possivel atualizar o item.");
      }

      updateLocalItem(json.item);
      setToast({
        tone: "success",
        message: item.isActive ? "Item desativado." : "Item ativado.",
      });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel atualizar o item.",
      });
    }
  }

  async function handleUpload(itemId: string, file: File | null) {
    if (!file) {
      return;
    }

    try {
      setToast(null);
      setUploadingItemId(itemId);
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("file", file);

      const response = await fetch("/api/menu/items/image", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message || "Nao foi possivel enviar a imagem.");
      }

      setMenuItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                imageUrl: json.item.imageUrl,
              }
            : item,
        ),
      );
      setToast({ tone: "success", message: "Imagem atualizada com sucesso." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.",
      });
    } finally {
      setUploadingItemId(null);
      const input = fileInputsRef.current[itemId];
      if (input) {
        input.value = "";
      }
    }
  }

  async function handleRemoveImage(itemId: string) {
    try {
      setToast(null);
      setRemovingItemId(itemId);
      const response = await fetch("/api/menu/items/image", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message || "Nao foi possivel remover a imagem.");
      }

      setMenuItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                imageUrl: null,
              }
            : item,
        ),
      );
      setToast({ tone: "success", message: "Imagem removida com sucesso." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel remover a imagem.",
      });
    } finally {
      setRemovingItemId(null);
    }
  }

  return (
    <main className="space-y-6 text-[var(--foreground)]">
      <section className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm transition hover:border-[var(--brand-orange)]/30 hover:shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-3 text-[var(--muted)]">Catalogo</p>
            <h1 className="text-3xl font-semibold tracking-tight">Cardapio da loja</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Crie e edite itens, ingredientes, preco, status e combinacoes de combo sem sair do dashboard.
            </p>
          </div>
          <button
            className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
            onClick={() => openEditor(null)}
            type="button"
          >
            Novo item
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
            <p className="font-medium">Categorias</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{categoryList.length} cadastradas</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
            <p className="font-medium">Itens</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{menuItems.length} cadastrados</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
            <p className="font-medium">Com imagem</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{imageCount} itens</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
            <p className="font-medium">Combos</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{comboCount} itens</p>
          </article>
        </div>
      </section>

      {toast ? (
        <div className={`rounded-[1.4rem] border px-4 py-3 text-sm ${toast.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      ) : null}

      <section className="space-y-4">
        <section className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Categorias</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Crie, edite e remova categorias do cardapio.</p>
            </div>
            <button
              className="rounded-full bg-[var(--brand-orange)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
              onClick={() => openCategoryEditor()}
              type="button"
            >
              Nova categoria
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {categoryItemCounts.map((category) => (
              <article key={category.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--background)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--foreground)]">{category.name}</h3>
                      {!category.isActive ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[0.68rem] font-semibold text-red-700">Inativa</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">Slug: {category.slug}</p>
                    {category.description ? <p className="mt-1 text-sm text-[var(--muted)]">{category.description}</p> : null}
                  </div>
                  <div className="text-right text-xs text-[var(--muted)]">
                    <p>Ordem: {category.sortOrder}</p>
                    <p className="mt-1">{category.itemCount} item(ns)</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-strong)]"
                    onClick={() => openCategoryEditor(category)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    onClick={() => openDeleteCategoryDialog(category)}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-4">
              <label className="block text-sm text-[var(--muted)]" htmlFor="menu-item-search">Buscar item</label>
              <input
                className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--background-strong)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/40 focus:border-[var(--brand-orange)]/40"
                id="menu-item-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: x-burguer, combo, pastel..."
                value={search}
              />
            </div>
            <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-4">
              <label className="block text-sm text-[var(--muted)]" htmlFor="category-filter">Filtrar categoria</label>
              <select
                className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--background-strong)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--brand-orange)]/40"
                id="category-filter"
                onChange={(event) => setSelectedCategory(event.target.value)}
                value={selectedCategory}
              >
                <option value="all">Todas as categorias</option>
                {categoryList.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {visibleItems.map((item) => {
              const optionLabels = (item.optionGroups || []).map((group) => group.optionGroup.name);
              const ingredientLabels = (item.ingredients || []).map((link) => link.ingredient.name);
              const comboSummary = (item.comboItems || []).map((component) => `${component.quantity}x ${component.componentMenuItem.name}`);
              return (
                <article key={item.id} className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_8px_24px_rgba(45,24,11,0.04)] transition hover:border-[var(--brand-orange)]/30 hover:shadow-[0_14px_30px_rgba(242,122,34,0.1)] sm:flex-row">
                  <div className="relative min-h-[220px] w-full shrink-0 bg-[var(--background-strong)] sm:w-[220px]">
                    {item.imageUrl ? (
                      <Image alt={item.name} className="object-cover" fill sizes="220px" src={resolveMenuItemImage(item.imageUrl)} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">Sem imagem</div>
                    )}
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">{item.category.name}</span>
                      <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${item.kind === "combo" ? "bg-[var(--brand-orange)] text-white" : "bg-[var(--brand-green)]/90 text-white"}`}>{item.kind}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                      <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-semibold tracking-tight">{item.name}</h2>
                          {!item.isActive ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-[0.7rem] font-semibold text-red-700">Inativo</span> : null}
                          {item.isFeatured ? <span className="rounded-full bg-[var(--brand-orange)]/10 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--brand-orange-dark)]">Destaque</span> : null}
                          {item.availableWeekdays?.length ? (
                            <span className="rounded-full bg-[var(--brand-green)]/10 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--brand-green-dark)]">
                              {formatMenuWeekdays(item.availableWeekdays)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description || "Ingredientes nao informados."}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-[var(--brand-green-dark)]">{formatMoney(asNumber(item.price) ?? 0)}</p>
                        {item.compareAtPrice ? <p className="mt-1 text-sm text-[var(--muted)] line-through">{formatMoney(asNumber(item.compareAtPrice) ?? 0)}</p> : null}
                      </div>
                    </div>

                    {optionLabels.length ? (
                      <p className="mt-4 text-sm text-[var(--muted)]">Adicionais: {optionLabels.join(", ")}</p>
                    ) : null}
                    {ingredientLabels.length ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">Ingredientes: {ingredientLabels.join(", ")}</p>
                    ) : null}
                    {comboSummary.length ? (
                      <p className="mt-2 text-sm text-[var(--muted)]">Combo: {comboSummary.join(" • ")}</p>
                    ) : null}

                    <div className="mt-auto flex flex-wrap gap-3 pt-5">
                      <button
                        className="rounded-full bg-[var(--brand-orange)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
                        onClick={() => openEditor(item.id)}
                        type="button"
                      >
                        Editar item
                      </button>
                      <button
                        className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                        onClick={() => void toggleActive(item)}
                        type="button"
                      >
                        {item.isActive ? "Desativar" : "Ativar"}
                      </button>
                      <label className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)] cursor-pointer">
                        {uploadingItemId === item.id ? "Enviando..." : item.imageUrl ? "Trocar imagem" : "Enviar imagem"}
                        <input
                          ref={(node) => {
                            fileInputsRef.current[item.id] = node;
                          }}
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            void handleUpload(item.id, event.target.files?.[0] || null);
                          }}
                          type="file"
                        />
                      </label>
                      <button
                        className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                        disabled={!item.imageUrl || removingItemId === item.id}
                        onClick={() => void handleRemoveImage(item.id)}
                        type="button"
                      >
                        {removingItemId === item.id ? "Removendo..." : "Remover imagem"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {isEditorOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(30,18,8,0.58)] px-4 py-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeEditor();
            }
          }}
        >
          <div className="panel flex max-h-[min(92vh,980px)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-[var(--surface)] shadow-[0_24px_80px_rgba(28,16,6,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
              <div>
                <p className="eyebrow mb-2 text-[var(--muted)]">Editor</p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {selectedItemId ? "Editar item" : "Criar novo item"}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Ajuste ingredientes, preco, status e composicao de combo num unico fluxo.
                </p>
              </div>
              <div className="flex gap-2">
                {selectedItemId ? (
                  <button
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--background)]"
                    onClick={() => openEditor(null)}
                    type="button"
                  >
                    Novo item
                  </button>
                ) : null}
                <button
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                  onClick={closeEditor}
                  type="button"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-[var(--muted)]">
                  Categoria
                  <select className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]" onChange={(event) => setEditor((current) => ({ ...current, categoryId: event.target.value }))} value={editor.categoryId}>
                    {categoryList.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-[var(--muted)]">
                  Tipo do item
                  <select className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]" onChange={(event) => setEditor((current) => ({ ...current, kind: event.target.value as EditorState["kind"] }))} value={editor.kind}>
                    <option value="simples">Simples</option>
                    <option value="combo">Combo</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <label className="block text-sm text-[var(--muted)]">
                    Nome do item
                    <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]" onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))} value={editor.name} />
                  </label>

                  <label className="block text-sm text-[var(--muted)]">
                    Slug (opcional)
                    <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]" onChange={(event) => setEditor((current) => ({ ...current, slug: event.target.value }))} value={editor.slug} />
                  </label>

                  <label className="block text-sm text-[var(--muted)]">
                    Ingredientes / descricao
                    <textarea className="mt-2 min-h-[140px] w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]" onChange={(event) => setEditor((current) => ({ ...current, ingredients: event.target.value }))} value={editor.ingredients} />
                  </label>

                  {editor.kind === "combo" ? (
                    <div className="rounded-[1.5rem] border border-[var(--brand-orange)]/20 bg-[var(--brand-orange)]/6 p-4">
                      <p className="text-sm font-semibold text-[var(--brand-orange-dark)]">Itens que formam o combo</p>
                      <div className="mt-3 grid gap-3 xl:grid-cols-2">
                        {componentCandidates.map((candidate) => {
                          const selected = editor.comboComponents.find((component) => component.componentMenuItemId === candidate.id);
                          return (
                            <div key={candidate.id} className="rounded-[1.1rem] border border-[var(--line)] bg-white px-3 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                                  <input checked={Boolean(selected)} onChange={() => toggleComboComponent(candidate.id)} type="checkbox" />
                                  <span>
                                    {candidate.name}
                                    <span className="ml-2 text-[var(--muted)]">• {candidate.category.name}</span>
                                  </span>
                                </label>
                                {selected ? (
                                  <input
                                    className="w-20 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                                    inputMode="numeric"
                                    min="1"
                                    onChange={(event) => updateComboComponentQuantity(candidate.id, event.target.value)}
                                    type="number"
                                    value={selected.quantity}
                                  />
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] p-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">Precificacao e status</p>
                    <div className="mt-4 grid gap-4">
                      <label className="text-sm text-[var(--muted)]">
                        Preco
                        <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--foreground)]" inputMode="decimal" onChange={(event) => setEditor((current) => ({ ...current, price: event.target.value }))} value={editor.price} />
                      </label>
                      <label className="text-sm text-[var(--muted)]">
                        De / compare at
                        <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--foreground)]" inputMode="decimal" onChange={(event) => setEditor((current) => ({ ...current, compareAtPrice: event.target.value }))} value={editor.compareAtPrice} />
                      </label>
                      <label className="text-sm text-[var(--muted)]">
                        Ordem
                        <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--foreground)]" inputMode="numeric" onChange={(event) => setEditor((current) => ({ ...current, sortOrder: event.target.value }))} value={editor.sortOrder} />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <label className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                        <input checked={editor.isActive} onChange={(event) => setEditor((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" />
                        Item ativo
                      </label>
                      <label className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                        <input checked={editor.isFeatured} onChange={(event) => setEditor((current) => ({ ...current, isFeatured: event.target.checked }))} type="checkbox" />
                        Item em destaque
                      </label>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] p-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">Grupos de adicionais</p>
                    <div className="mt-3 grid gap-2">
                      {optionGroups.map((group) => (
                        <label key={group.id} className="flex items-center gap-3 rounded-[1rem] bg-white px-3 py-2 text-sm text-[var(--foreground)]">
                          <input checked={editor.optionGroupIds.includes(group.id)} onChange={() => toggleOptionGroup(group.id)} type="checkbox" />
                          {group.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] p-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">Dias disponíveis</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Sem seleção = todos os dias. Use isso para pratos do dia.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {MENU_WEEKDAYS.map((weekday) => (
                        <button
                          key={weekday.value}
                          className={`rounded-[1rem] border px-3 py-2 text-sm font-medium transition ${editor.availableWeekdays.includes(weekday.value) ? "border-[var(--brand-green)] bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]" : "border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[var(--background)]"}`}
                          onClick={() => setEditor((current) => ({
                            ...current,
                            availableWeekdays: toggleWeekday(current.availableWeekdays, weekday.value),
                          }))}
                          type="button"
                        >
                          {weekday.short}
                        </button>
                      ))}
                    </div>
                    <button
                      className="mt-3 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--background)]"
                      onClick={() => setEditor((current) => ({ ...current, availableWeekdays: [] }))}
                      type="button"
                    >
                      Todos os dias
                    </button>
                  </div>

                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] p-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">Ingredientes (composicao)</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Selecione os ingredientes que vem no item. O cliente podera remover ou pedir mais.</p>
                    <div className="mt-3 grid gap-2">
                      {ingredients.map((ing) => (
                        <label key={ing.id} className="flex items-center gap-3 rounded-[1rem] bg-white px-3 py-2 text-sm text-[var(--foreground)]">
                          <input checked={editor.ingredientIds.includes(ing.id)} onChange={() => toggleIngredient(ing.id)} type="checkbox" />
                          {ing.name}
                        </label>
                      ))}
                    </div>
                  </div>
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
              <button className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:opacity-60" disabled={saving} onClick={() => void saveItem()} type="button">
                {saving ? "Salvando..." : selectedItemId ? "Salvar alteracoes" : "Criar item"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCategoryEditorOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(30,18,8,0.58)] px-4 py-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeCategoryEditor();
            }
          }}
        >
          <div className="panel flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-[var(--surface)] shadow-[0_24px_80px_rgba(28,16,6,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
              <div>
                <p className="eyebrow mb-2 text-[var(--muted)]">Categorias</p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {categoryEditor.id ? "Editar categoria" : "Criar categoria"}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Ajuste nome, slug, janela de atendimento, ordem e status da categoria.
                </p>
              </div>
              <button
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                onClick={closeCategoryEditor}
                type="button"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 overflow-y-auto px-6 py-6">
              <label className="block text-sm text-[var(--muted)]">
                Nome
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                  onChange={(event) => setCategoryEditor((current) => ({ ...current, name: event.target.value }))}
                  value={categoryEditor.name}
                />
              </label>

              <label className="block text-sm text-[var(--muted)]">
                Slug (opcional)
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                  onChange={(event) => setCategoryEditor((current) => ({ ...current, slug: event.target.value }))}
                  value={categoryEditor.slug}
                />
              </label>

              <label className="block text-sm text-[var(--muted)]">
                Descricao
                <textarea
                  className="mt-2 min-h-[120px] w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                  onChange={(event) => setCategoryEditor((current) => ({ ...current, description: event.target.value }))}
                  value={categoryEditor.description}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[var(--muted)]">
                  Ordem
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                    inputMode="numeric"
                    onChange={(event) => setCategoryEditor((current) => ({ ...current, sortOrder: event.target.value }))}
                    value={categoryEditor.sortOrder}
                  />
                </label>
                <label className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                  <input
                    checked={categoryEditor.isActive}
                    onChange={(event) => setCategoryEditor((current) => ({ ...current, isActive: event.target.checked }))}
                    type="checkbox"
                  />
                  Categoria ativa
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[var(--muted)]">
                  Disponivel de
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                    onChange={(event) => setCategoryEditor((current) => ({ ...current, availableFrom: event.target.value }))}
                    type="time"
                    value={categoryEditor.availableFrom}
                  />
                </label>

                <label className="block text-sm text-[var(--muted)]">
                  Disponivel ate
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                    onChange={(event) => setCategoryEditor((current) => ({ ...current, availableUntil: event.target.value }))}
                    type="time"
                    value={categoryEditor.availableUntil}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--line)] px-6 py-5">
              <button
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                onClick={closeCategoryEditor}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:opacity-60"
                disabled={savingCategory}
                onClick={() => void saveCategory()}
                type="button"
              >
                {savingCategory ? "Salvando..." : categoryEditor.id ? "Salvar alteracoes" : "Criar categoria"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteCategoryState ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(30,18,8,0.58)] px-4 py-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteCategoryDialog();
            }
          }}
        >
          <div className="panel flex w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-[var(--surface)] shadow-[0_24px_80px_rgba(28,16,6,0.28)]">
            <div className="border-b border-[var(--line)] px-6 py-5">
              <p className="eyebrow mb-2 text-[var(--muted)]">Excluir categoria</p>
              <h2 className="text-2xl font-semibold tracking-tight">{deleteCategoryState.name}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {deleteCategoryState.itemCount > 0
                  ? `Essa categoria tem ${deleteCategoryState.itemCount} item(ns). Escolha o que fazer antes de excluir.`
                  : "Essa categoria esta vazia e pode ser excluida diretamente."}
              </p>
            </div>

            <div className="grid gap-4 px-6 py-6">
              {deleteCategoryState.itemCount > 0 ? (
                <>
                  <label className="flex items-start gap-3 rounded-[1.2rem] border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)]">
                    <input
                      checked={deleteCategoryState.strategy === "move_items"}
                      onChange={() =>
                        setDeleteCategoryState((current) =>
                          current ? { ...current, strategy: "move_items" } : current,
                        )
                      }
                      type="radio"
                    />
                    <span>
                      <strong>Mover itens para outra categoria</strong>
                      <span className="mt-1 block text-[var(--muted)]">Mantem os itens e troca apenas a categoria.</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-[1.2rem] border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)]">
                    <input
                      checked={deleteCategoryState.strategy === "delete_items"}
                      onChange={() =>
                        setDeleteCategoryState((current) =>
                          current ? { ...current, strategy: "delete_items" } : current,
                        )
                      }
                      type="radio"
                    />
                    <span>
                      <strong>Excluir os itens junto</strong>
                      <span className="mt-1 block text-[var(--muted)]">Os itens serao removidos junto com a categoria, quando possivel.</span>
                    </span>
                  </label>

                  {deleteCategoryState.strategy === "move_items" ? (
                    <label className="block text-sm text-[var(--muted)]">
                      Categoria de destino
                      <select
                        className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)]"
                        onChange={(event) =>
                          setDeleteCategoryState((current) =>
                            current ? { ...current, targetCategoryId: event.target.value } : current,
                          )
                        }
                        value={deleteCategoryState.targetCategoryId}
                      >
                        <option value="">Selecione...</option>
                        {categoryList
                          .filter((category) => category.id !== deleteCategoryState.id)
                          .map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                      </select>
                    </label>
                  ) : null}
                </>
              ) : null}

              <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Se houver itens com historico de pedidos ou combinacoes, a exclusao sera bloqueada.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--line)] px-6 py-5">
              <button
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                onClick={closeDeleteCategoryDialog}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                disabled={
                  deletingCategory ||
                  (deleteCategoryState.strategy === "move_items" && !deleteCategoryState.targetCategoryId)
                }
                onClick={() => void deleteCategory()}
                type="button"
              >
                {deletingCategory ? "Excluindo..." : "Excluir categoria"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
