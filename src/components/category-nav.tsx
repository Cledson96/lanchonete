"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CategoryNavProps = {
  categories: { id: string; name: string; slug: string }[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
};

const iconMap: Record<string, string> = {
  lanche: "M15 11h.01A7 7 0 003 11h18a7 7 0 00-14 0M3 15.5h18M5 19.5h14",
  burger: "M15 11h.01A7 7 0 003 11h18a7 7 0 00-14 0M3 15.5h18M5 19.5h14",
  bebida: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M14.25 3.104c.251.023.501.05.75.082M3 21h18",
  suco: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M14.25 3.104c.251.023.501.05.75.082M3 21h18",
  pastel: "M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m18-3l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 13.5",
  tapioca: "M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m18-3l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 13.5",
  acai: "M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  combo: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  doce: "M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  sobremesa: "M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
};

const defaultIcon = "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5";

function getCategoryIconPath(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, path] of Object.entries(iconMap)) {
    if (lower.includes(key)) return path;
  }
  return defaultIcon;
}

function CategoryIcon({ name }: { name: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <path d={getCategoryIconPath(name)} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

  const activeClasses = "bg-[var(--success-light)] text-[var(--green-rich)] shadow-[0_4px_14px_rgba(74,124,46,0.1)]";
  const inactiveClasses = "bg-white text-[var(--muted)] hover:bg-[var(--cream)] hover:text-[var(--green-rich)]";

  return (
    <div className="sticky top-[59px] z-30 border-b border-[var(--line)] bg-[var(--background)]/92 backdrop-blur-xl">
      <div className="shell py-2.5">
        {/* Desktop nav */}
        <div className="hidden items-center gap-2 lg:flex">
          {primaryCategories.map((category) => {
            const isActive = category.id === activeCategoryId;

            return (
              <button
                key={category.id}
                aria-current={isActive ? "true" : undefined}
                className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-[0.82rem] font-semibold transition-all duration-200 ${
                  isActive ? activeClasses : inactiveClasses
                }`}
                onClick={() => handleSelect(category.id)}
                type="button"
              >
                <CategoryIcon name={category.name} />
                <span>{category.name}</span>
                {isActive ? (
                  <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-[var(--accent)]" />
                ) : null}
              </button>
            );
          })}

          {overflowCategories.length ? (
            <div className="relative" ref={moreRef}>
              <button
                aria-expanded={isMoreOpen}
                className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-[0.82rem] font-semibold transition-all duration-200 ${
                  activeOverflowCategory || isMoreOpen ? activeClasses : inactiveClasses
                }`}
                onClick={() => setIsMoreOpen((value) => !value)}
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm6 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm6 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{activeOverflowCategory?.name || "Mais"}</span>
              </button>

              {isMoreOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[220px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-lg)]">
                  {overflowCategories.map((category) => {
                    const isActive = category.id === activeCategoryId;

                    return (
                      <button
                        key={category.id}
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[0.82rem] font-semibold transition-all duration-200 ${
                          isActive
                            ? "bg-[var(--success-light)] text-[var(--green-rich)]"
                            : "text-[var(--muted)] hover:bg-[var(--cream)] hover:text-[var(--green-rich)]"
                        }`}
                        onClick={() => handleSelect(category.id)}
                        type="button"
                      >
                        <CategoryIcon name={category.name} />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Mobile horizontal scroll */}
        <div className="relative overflow-x-auto lg:hidden [scrollbar-width:none]">
          <div className="flex min-w-max items-center gap-2 pr-12">
            {categories.map((category) => {
              const isActive = category.id === activeCategoryId;

              return (
                <button
                  key={category.id}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] font-semibold transition-all duration-200 ${
                    isActive ? activeClasses : inactiveClasses
                  }`}
                  onClick={() => handleSelect(category.id)}
                  type="button"
                >
                  <CategoryIcon name={category.name} />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--background)] to-transparent" />
        </div>
      </div>
    </div>
  );
}
