"use client";

import { useMemo, useState } from "react";
import { CategoryNav } from "@/components/menu/category-nav";
import { MenuItemCard } from "@/components/menu/item-card";
import type { PublicMenuCategory } from "@/lib/contracts/menu";

type Props = {
  categories: PublicMenuCategory[];
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
    <section className="pb-14" id="cardapio">
      <CategoryNav
        activeCategoryId={activeCategoryId}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        }))}
        onSelect={handleSelectCategory}
      />

      <div className="shell pt-5">
        {/* Section header */}
        <div className="mb-4">
          <div className="flex items-end justify-between gap-4">
            {/* Título com acento laranja */}
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="block h-9 w-1 rounded-full bg-gradient-to-b from-[var(--brand-orange)] to-[var(--brand-green)]"
              />
              <div>
                <h2 className="text-[1.45rem] font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
                  {activeCategory?.name || "Cardápio"}
                </h2>
                {activeCategory?.description ? (
                  <p className="mt-0.5 max-w-sm text-[0.8rem] leading-snug text-[var(--muted)]">
                    {activeCategory.description}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Contador como badge */}
            <span className="shrink-0 rounded-full border border-[var(--line)] bg-white px-3 py-1 text-[0.72rem] font-semibold text-[var(--muted)]">
              {showingStart}–{showingEnd} de {activeCategory?.menuItems.length || 0}
            </span>
          </div>

          {/* Linha decorativa */}
          <div className="mt-4 h-px bg-gradient-to-r from-[var(--brand-orange)] via-[var(--line)] to-transparent" />
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paginatedItems.map((item) => (
            <MenuItemCard
              key={item.id}
              categoryName={activeCategory?.name || ""}
              categoryAvailability={activeCategory ? { availableFrom: activeCategory.availableFrom, availableUntil: activeCategory.availableUntil } : undefined}
              compareAtPrice={item.compareAtPrice}
              description={item.description}
              id={item.id}
              imageUrl={item.imageUrl}
              ingredients={item.ingredients}
              name={item.name}
              optionGroups={item.optionGroups}
              price={item.price}
              availableWeekdays={item.availableWeekdays}
            />
          ))}
        </div>

        {/* Empty state */}
        {!paginatedItems.length ? (
          <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] bg-white/60 px-6 py-12 text-center text-[var(--muted)]">
            <svg aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-[var(--line)]" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Nenhum item cadastrado nessa categoria ainda.
          </div>
        ) : null}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
            <button
              className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-4 py-2 text-[0.82rem] font-semibold text-[var(--muted)] transition-all duration-200 hover:border-[var(--green-rich)] hover:text-[var(--green-rich)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              <svg aria-hidden="true" className="inline h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                aria-current={page === currentPage ? "page" : undefined}
                className={`h-9 min-w-9 cursor-pointer rounded-full px-3 text-[0.82rem] font-bold transition-all duration-200 ${
                  page === currentPage
                    ? "bg-[var(--green-rich)] text-white shadow-[0_4px_14px_rgba(74,124,46,0.2)]"
                    : "bg-white text-[var(--muted)] hover:bg-[var(--success-light)] hover:text-[var(--green-rich)]"
                }`}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}

            <button
              className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-4 py-2 text-[0.82rem] font-semibold text-[var(--muted)] transition-all duration-200 hover:border-[var(--green-rich)] hover:text-[var(--green-rich)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              type="button"
            >
              Próxima
              <svg aria-hidden="true" className="inline h-3.5 w-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
