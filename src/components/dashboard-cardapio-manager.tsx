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
    <main className="panel rounded-[2rem] border-white/10 bg-white/7 p-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-3 text-white/60">Catalogo</p>
          <h1 className="text-3xl font-semibold tracking-tight">Cardapio com imagens</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">
            Suba a foto de cada item por aqui. A imagem fica salva no proprio
            servidor e passa a aparecer na home, no pedido e no restante do
            cardapio.
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/7 px-4 py-4 text-sm text-white/72">
          {withImageCount} de {menuItems.length} itens com imagem cadastrada
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.5rem] border border-white/10 px-4 py-4">
          <p className="font-medium">Categorias</p>
          <p className="mt-2 text-sm text-white/64">
            {categories.length} categorias cadastradas
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 px-4 py-4">
          <p className="font-medium">Itens</p>
          <p className="mt-2 text-sm text-white/64">
            {menuItems.length} itens configurados
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 px-4 py-4">
          <p className="font-medium">Adicionais</p>
          <p className="mt-2 text-sm text-white/64">
            {optionGroups.length} grupos configurados
          </p>
        </article>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_260px]">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4">
          <label className="block text-sm text-white/64" htmlFor="menu-item-search">
            Buscar item
          </label>
          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#120d0b] px-4 py-3 text-white outline-none transition placeholder:text-white/24 focus:border-white/30"
            id="menu-item-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: x-burguer, pastel, acai..."
            value={search}
          />
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4">
          <label className="block text-sm text-white/64" htmlFor="category-filter">
            Filtrar categoria
          </label>
          <select
            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#120d0b] px-4 py-3 text-white outline-none focus:border-white/30"
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

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        {visibleItems.map((item) => {
          const imageLabel = item.imageUrl ? "Trocar imagem" : "Enviar imagem";
          const optionLabels = item.optionGroups.map((group) => group.optionGroup.name);

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]"
            >
              <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="relative min-h-[220px] bg-[#120d0b]">
                  <Image
                    alt={item.name}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 220px"
                    src={resolveMenuItemImage(item.imageUrl)}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/56">
                      {item.category.name}
                    </p>
                    <p className="mt-2 font-display text-2xl text-white">
                      {formatMoney(moneyValue(item.price))}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight">{item.name}</h2>
                      {item.isFeatured ? (
                        <span className="rounded-full border border-orange-300/30 bg-orange-500/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-orange-100">
                          Destaque
                        </span>
                      ) : null}
                      {!item.isActive ? (
                        <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/62">
                          Inativo
                        </span>
                      ) : null}
                    </div>

                    {item.description ? (
                      <p className="mt-3 leading-7 text-white/68">{item.description}</p>
                    ) : (
                      <p className="mt-3 text-sm leading-7 text-white/42">
                        Sem descricao cadastrada.
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {optionLabels.length ? (
                        optionLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-white/10 bg-white/7 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/70"
                          >
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/7 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/46">
                          Sem adicionais
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                      className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={uploadingItemId === item.id || removingItemId === item.id}
                      onClick={() => fileInputsRef.current[item.id]?.click()}
                      type="button"
                    >
                      {uploadingItemId === item.id ? "Enviando..." : imageLabel}
                    </button>

                    <button
                      className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white/84 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!item.imageUrl || uploadingItemId === item.id || removingItemId === item.id}
                      onClick={() => handleRemove(item.id)}
                      type="button"
                    >
                      {removingItemId === item.id ? "Removendo..." : "Excluir imagem"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!visibleItems.length ? (
        <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/6 px-5 py-8 text-center text-white/64">
          {isPending ? "Atualizando lista..." : "Nenhum item encontrado com esse filtro."}
        </div>
      ) : null}
    </main>
  );
}
