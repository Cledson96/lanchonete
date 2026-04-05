"use client";

import { useMemo, useState } from "react";
import { CategoryNav } from "@/components/category-nav";
import { MenuItemCard } from "@/components/menu-item-card";

type MenuBrowserItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
};

type MenuBrowserCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  menuItems: MenuBrowserItem[];
};

type Props = {
  categories: MenuBrowserCategory[];
};

const ITEMS_PER_PAGE = 8;

export function MenuBrowser({ categories }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [currentPage, setCurrentPage] = useState(1);

  function handleSelectCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    setCurrentPage(1);
  }

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? categories[0],
    [activeCategoryId, categories],
  );

  const totalPages = Math.max(
    1,
    Math.ceil((activeCategory?.menuItems.length || 0) / ITEMS_PER_PAGE),
  );

  const paginatedItems = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activeCategory.menuItems.slice(start, start + ITEMS_PER_PAGE);
  }, [activeCategory, currentPage]);

  const showingStart = activeCategory
    ? (currentPage - 1) * ITEMS_PER_PAGE + 1
    : 0;
  const showingEnd = activeCategory
    ? Math.min(currentPage * ITEMS_PER_PAGE, activeCategory.menuItems.length)
    : 0;

  return (
    <section className="pb-18" id="cardapio">
      <CategoryNav
        activeCategoryId={activeCategoryId}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        }))}
        onSelect={handleSelectCategory}
      />

      <div className="shell pt-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#a16e45]">
              Cardapio por categoria
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#2a170d] sm:text-4xl">
              {activeCategory?.name || "Cardapio"}
            </h2>
            <p className="mt-3 max-w-2xl text-[1rem] leading-7 text-[#715846]">
              {activeCategory?.description ||
                "Toque na categoria para trocar a vitrine e siga paginando ate encontrar o pedido certo."}
            </p>
          </div>

          <div className="rounded-[1.4rem] border border-[#f0ddca] bg-white px-4 py-4 text-sm text-[#7d5a3b] shadow-[0_12px_36px_rgba(163,89,36,0.08)]">
            Mostrando {showingStart} a {showingEnd} de{" "}
            <strong className="text-[#e96118]">
              {activeCategory?.menuItems.length || 0}
            </strong>{" "}
            itens
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {paginatedItems.map((item) => (
            <MenuItemCard
              key={item.id}
              categoryName={activeCategory?.name || ""}
              compareAtPrice={item.compareAtPrice}
              description={item.description}
              id={item.id}
              imageUrl={item.imageUrl}
              name={item.name}
              price={item.price}
            />
          ))}
        </div>

        {!paginatedItems.length ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#f0ddca] bg-white/72 px-5 py-10 text-center text-[#8c6e57]">
            Nenhum item cadastrado nessa categoria ainda.
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              className="rounded-full border border-[#f0ddca] bg-white px-4 py-2 text-sm font-semibold text-[#7a573d] transition hover:border-[#f26b21] hover:text-[#f26b21] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                aria-current={page === currentPage ? "page" : undefined}
                className={`h-10 min-w-10 rounded-full px-3 text-sm font-bold transition ${
                  page === currentPage
                    ? "bg-[#f26b21] text-white shadow-[0_10px_24px_rgba(242,107,33,0.28)]"
                    : "bg-white text-[#7a573d] hover:bg-[#fff1e5] hover:text-[#f26b21]"
                }`}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}

            <button
              className="rounded-full border border-[#f0ddca] bg-white px-4 py-2 text-sm font-semibold text-[#7a573d] transition hover:border-[#f26b21] hover:text-[#f26b21] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              type="button"
            >
              Proxima
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
