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

  const showingStart = activeCategory ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
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

      <div className="shell pt-7">
        <div className="mb-7 flex flex-col gap-4 border-b border-[#ebdbc7] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#a06f42]">
              Cardapio
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#40602f] sm:text-4xl">
              {activeCategory?.name || "Cardapio"}
            </h2>
          </div>

          <div className="rounded-full border border-[#e7d8c4] bg-white px-4 py-3 text-sm text-[#6f654e] shadow-[0_12px_28px_rgba(115,90,58,0.06)]">
            Mostrando {showingStart} a {showingEnd} de{" "}
            <strong className="text-[#da7323]">{activeCategory?.menuItems.length || 0}</strong>
            {" "}itens
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
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#e6d7c3] bg-white/78 px-5 py-10 text-center text-[#8c6e57]">
            Nenhum item cadastrado nessa categoria ainda.
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              className="rounded-full border border-[#e7d8c4] bg-white px-4 py-2 text-sm font-semibold text-[#6e604d] transition hover:border-[#567b35] hover:text-[#567b35] disabled:cursor-not-allowed disabled:opacity-40"
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
                    ? "bg-[#567b35] text-white shadow-[0_10px_24px_rgba(86,123,53,0.24)]"
                    : "bg-white text-[#6e604d] hover:bg-[#eef5e8] hover:text-[#567b35]"
                }`}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}

            <button
              className="rounded-full border border-[#e7d8c4] bg-white px-4 py-2 text-sm font-semibold text-[#6e604d] transition hover:border-[#567b35] hover:text-[#567b35] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
