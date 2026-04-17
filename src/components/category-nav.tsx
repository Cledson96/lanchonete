"use client";

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
  especial: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  salgado: "M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m18-3l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 13.5",
  artesana: "M15 11h.01A7 7 0 003 11h18a7 7 0 00-14 0M3 15.5h18M5 19.5h14",
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
      className="h-3.5 w-3.5 shrink-0"
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
  const activeClasses =
    "bg-[var(--brand-orange)] text-white border border-[var(--brand-orange)] shadow-[0_4px_14px_rgba(234,106,28,0.32)]";
  const inactiveClasses =
    "bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange-dark)] hover:bg-[var(--accent-light)]";

  return (
    <div className="sticky top-[59px] z-30 bg-[var(--background)]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(36,18,8,0.07)]">
      <div className="shell py-3">
        {/* Desktop: flex-wrap */}
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          {categories.map((category) => {
            const isActive = category.id === activeCategoryId;
            return (
              <button
                key={category.id}
                aria-current={isActive ? "true" : undefined}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition-all duration-200 ${
                  isActive ? activeClasses : inactiveClasses
                }`}
                onClick={() => onSelect(category.id)}
                type="button"
              >
                <CategoryIcon name={category.name} />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="relative overflow-x-auto lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-2 pr-10">
            {categories.map((category) => {
              const isActive = category.id === activeCategoryId;
              return (
                <button
                  key={category.id}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition-all duration-200 ${
                    isActive ? activeClasses : inactiveClasses
                  }`}
                  onClick={() => onSelect(category.id)}
                  type="button"
                >
                  <CategoryIcon name={category.name} />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[var(--background)] to-transparent" />
        </div>
      </div>
    </div>
  );
}
