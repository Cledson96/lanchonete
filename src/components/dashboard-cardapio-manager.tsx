"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { formatMoney } from "@/lib/utils";

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
};

type OptionGroupSummary = {
  id: string;
  name: string;
};

type MenuItemSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number | { toString(): string };
  isFeatured: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
  optionGroups: Array<{
    optionGroup: {
      id: string;
      name: string;
    };
  }>;
};

type Props = {
  categories: CategorySummary[];
  items: MenuItemSummary[];
  optionGroups: OptionGroupSummary[];
};

type ToastState = {
  tone: "success" | "error";
  message: string;
} | null;

function moneyValue(value: MenuItemSummary["price"]) {
  return typeof value === "number" ? value : Number(value.toString());
}

export function DashboardCardapioManager({
  categories,
  items,
  optionGroups,
}: Props) {
  const [menuItems, setMenuItems] = useState(items);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isPending, startTransition] = useTransition();
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category.id === selectedCategory;
      const haystack = `${item.name} ${item.category.name} ${item.description || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, search, selectedCategory]);

  const withImageCount = menuItems.filter((item) => item.imageUrl).length;

  function updateItemImage(itemId: string, imageUrl: string | null) {
    setMenuItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              imageUrl,
            }
          : item,
      ),
    );
  }

  async function handleUpload(itemId: string, file: File | null) {
    if (!file) {
      return;
    }

    setToast(null);
    setUploadingItemId(itemId);

    try {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("file", file);

      const response = await fetch("/api/menu/items/image", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Nao foi possivel enviar a imagem.");
      }

      updateItemImage(itemId, payload.item.imageUrl);
      setToast({
        tone: "success",
        message: "Imagem atualizada com sucesso.",
      });
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.",
      });
    } finally {
      setUploadingItemId(null);

      const input = fileInputsRef.current[itemId];

      if (input) {
        input.value = "";
      }
    }
  }

  async function handleRemove(itemId: string) {
    setToast(null);
    setRemovingItemId(itemId);

    try {
      const response = await fetch("/api/menu/items/image", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Nao foi possivel remover a imagem.");
      }

      updateItemImage(itemId, null);
      setToast({
        tone: "success",
        message: "Imagem removida com sucesso.",
      });
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Nao foi possivel remover a imagem.",
      });
    } finally {
      setRemovingItemId(null);
    }
  }

  return (
    <main className="panel shadow-sm transition hover:shadow-md hover:border-[var(--brand-orange)]/30 rounded-[2rem] border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--foreground)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-3 text-[var(--muted)]">Catalogo</p>
          <h1 className="text-3xl font-semibold tracking-tight">Cardapio com imagens</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Suba a foto de cada item por aqui. A imagem fica salva no proprio
            servidor e passa a aparecer na home, no pedido e no restante do
            cardapio.
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--muted)]">
          {withImageCount} de {menuItems.length} itens com imagem cadastrada
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
          <p className="font-medium">Categorias</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {categories.length} categorias cadastradas
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
          <p className="font-medium">Itens</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {menuItems.length} itens configurados
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4">
          <p className="font-medium">Adicionais</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {optionGroups.length} grupos configurados
          </p>
        </article>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_260px]">
        <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-4">
          <label className="block text-sm text-[var(--muted)]" htmlFor="menu-item-search">
            Buscar item
          </label>
          <input
            className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--background-strong)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/40 focus:border-[var(--brand-orange)]/40"
            id="menu-item-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: x-burguer, pastel, acai..."
            value={search}
          />
        </div>

        <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-4">
          <label className="block text-sm text-[var(--muted)]" htmlFor="category-filter">
            Filtrar categoria
          </label>
          <select
            className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--background-strong)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--brand-orange)]/40"
            id="category-filter"
            onChange={(event) => {
              const value = event.target.value;
              startTransition(() => {
                setSelectedCategory(value);
              });
            }}
            value={selectedCategory}
          >
            <option value="all">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {toast ? (
        <div
          className={`mt-5 rounded-[1.4rem] border px-4 py-3 text-sm ${
            toast.tone === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-red-400/30 bg-red-500/10 text-red-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-5">
        {visibleItems.map((item) => {
          const imageLabel = item.imageUrl ? "Trocar imagem" : "Enviar imagem";
          const optionLabels = item.optionGroups.map((group) => group.optionGroup.name);

          return (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-[var(--brand-orange)]/40 hover:shadow-[0_8px_30px_rgba(242,122,34,0.08)] sm:flex-row"
            >
              {/* Image Section */}
              <div className="relative min-h-[220px] w-full shrink-0 bg-[var(--background-strong)] sm:w-[260px]">
                {item.imageUrl ? (
                  <Image
                    alt={item.name}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    fill
                    sizes="(max-width: 768px) 100vw, 260px"
                    src={resolveMenuItemImage(item.imageUrl)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--background-strong)] text-[var(--muted)]">
                    <svg className="mx-auto h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute left-4 top-4">
                  <span className="rounded-md bg-white/90 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--foreground)] shadow-sm backdrop-blur-md">
                    {item.category.name}
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)] group-hover:text-[var(--brand-orange-dark)] transition-colors">
                        {item.name}
                      </h2>
                      {item.isFeatured ? (
                        <span className="rounded-full bg-[var(--brand-orange)]/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--brand-orange-dark)]">
                          Destaque
                        </span>
                      ) : null}
                      {!item.isActive ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-red-600">
                          Inativo
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="mt-2 line-clamp-2 text-[0.9rem] leading-relaxed text-[var(--muted)]">
                        {item.description}
                      </p>
                    ) : (
                      <p className="mt-2 text-[0.85rem] italic text-[var(--muted)]/50">
                        Nenhuma descrição cadastrada.
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-2xl font-bold text-[var(--brand-green-dark)]">
                      {formatMoney(moneyValue(item.price))}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {optionLabels.length ? (
                    optionLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-lg border border-[var(--line)] bg-[var(--background)] px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]"
                      >
                        + {label}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-lg border border-dashed border-[var(--line)] bg-transparent px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]/50">
                      Sem complementos
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex items-center gap-3 border-t border-[var(--line)] pt-5">
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      ref={(element) => {
                        fileInputsRef.current[item.id] = element;
                      }}
                      type="file"
                      onChange={(event) =>
                        handleUpload(item.id, event.currentTarget.files?.[0] ?? null)
                      }
                    />

                    <button
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[0.8rem] bg-[var(--brand-orange)] px-5 py-2.5 text-[0.85rem] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-orange-dark)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                      disabled={uploadingItemId === item.id || removingItemId === item.id}
                      onClick={() => fileInputsRef.current[item.id]?.click()}
                      type="button"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {uploadingItemId === item.id ? "Enviando..." : imageLabel}
                    </button>

                    {item.imageUrl && (
                      <button
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[0.8rem] border border-red-200 bg-white px-4 py-2.5 text-[0.85rem] font-bold text-red-600 shadow-sm transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={uploadingItemId === item.id || removingItemId === item.id}
                        onClick={() => handleRemove(item.id)}
                        type="button"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {removingItemId === item.id ? "Removendo..." : "Excluir"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!visibleItems.length ? (
        <div className="mt-8 rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-8 text-center text-[var(--muted)]">
          {isPending ? "Atualizando lista..." : "Nenhum item encontrado com esse filtro."}
        </div>
      ) : null}
    </main>
  );
}
