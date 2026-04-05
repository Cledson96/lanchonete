"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CategoryNavProps = {
  categories: { id: string; name: string; slug: string }[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
};

const iconMatchers: Array<{ pattern: RegExp; icon: string }> = [
  { pattern: /lanche|burger|artesan/i, icon: "🍔" },
  { pattern: /bebida|suco/i, icon: "🥤" },
  { pattern: /pastel/i, icon: "🥟" },
  { pattern: /tapioca/i, icon: "🥞" },
  { pattern: /acai/i, icon: "🍇" },
  { pattern: /combo/i, icon: "🍟" },
  { pattern: /doce|sobremesa/i, icon: "🍨" },
];

function getCategoryIcon(name: string) {
  return iconMatchers.find((item) => item.pattern.test(name))?.icon || "🍽️";
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onSelect,
}: CategoryNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const { primaryCategories, overflowCategories } = useMemo(() => {
    return {
      primaryCategories: categories.slice(0, 5),
      overflowCategories: categories.slice(5),
    };
  }, [categories]);

  const activeOverflowCategory = overflowCategories.find(
    (category) => category.id === activeCategoryId,
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!moreRef.current?.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }

    if (isMoreOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMoreOpen]);

  function handleSelect(categoryId: string) {
    onSelect(categoryId);
    setIsMoreOpen(false);
  }

  return (
    <div className="sticky top-[71px] z-30 border-b border-[#eadac7] bg-[#fff8f1]/96 backdrop-blur-xl">
      <div className="shell py-3">
        <div className="hidden items-center gap-3 lg:flex">
          {primaryCategories.map((category) => {
            const isActive = category.id === activeCategoryId;

            return (
              <button
                key={category.id}
                aria-current={isActive ? "true" : undefined}
                className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#eef5e8] text-[#567b35] shadow-[0_10px_22px_rgba(86,123,53,0.12)]"
                    : "bg-white text-[#7a664f] hover:bg-[#f7efdf] hover:text-[#567b35]"
                }`}
                onClick={() => handleSelect(category.id)}
                type="button"
              >
                <span aria-hidden="true">{getCategoryIcon(category.name)}</span>
                <span>{category.name}</span>
                {isActive ? (
                  <span className="absolute inset-x-4 -bottom-1 h-[2px] rounded-full bg-[#db7324]" />
                ) : null}
              </button>
            );
          })}

          {overflowCategories.length ? (
            <div className="relative" ref={moreRef}>
              <button
                aria-expanded={isMoreOpen}
                className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  activeOverflowCategory || isMoreOpen
                    ? "bg-[#eef5e8] text-[#567b35] shadow-[0_10px_22px_rgba(86,123,53,0.12)]"
                    : "bg-white text-[#7a664f] hover:bg-[#f7efdf] hover:text-[#567b35]"
                }`}
                onClick={() => setIsMoreOpen((value) => !value)}
                type="button"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ...
                </span>
                <span>{activeOverflowCategory?.name || "Mais"}</span>
              </button>

              {isMoreOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] min-w-[240px] overflow-hidden rounded-[1.3rem] border border-[#e7d8c4] bg-white p-2 shadow-[0_20px_48px_rgba(92,49,20,0.12)]">
                  {overflowCategories.map((category) => {
                    const isActive = category.id === activeCategoryId;

                    return (
                      <button
                        key={category.id}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? "bg-[#eef5e8] text-[#567b35]"
                            : "text-[#7a664f] hover:bg-[#fff8ef] hover:text-[#567b35]"
                        }`}
                        onClick={() => handleSelect(category.id)}
                        type="button"
                      >
                        <span aria-hidden="true">{getCategoryIcon(category.name)}</span>
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative overflow-x-auto lg:hidden [scrollbar-width:none]">
          <div className="flex min-w-max items-center gap-3 pr-14">
            {categories.map((category) => {
              const isActive = category.id === activeCategoryId;

              return (
                <button
                  key={category.id}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#eef5e8] text-[#567b35] shadow-[0_10px_22px_rgba(86,123,53,0.12)]"
                      : "bg-white text-[#7a664f] hover:bg-[#f7efdf] hover:text-[#567b35]"
                  }`}
                  onClick={() => handleSelect(category.id)}
                  type="button"
                >
                  <span aria-hidden="true">{getCategoryIcon(category.name)}</span>
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#fff8f1] to-transparent" />
        </div>
      </div>
    </div>
  );
}
