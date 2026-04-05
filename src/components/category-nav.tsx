"use client";

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
  return (
    <div className="sticky top-[76px] z-30 border-b border-[#f0ddca] bg-[#fff7ef]/92 backdrop-blur-xl">
      <div className="shell overflow-x-auto py-4 [scrollbar-width:none]">
        <div className="flex min-w-max items-center gap-3">
          {categories.map((category) => {
            const isActive = category.id === activeCategoryId;

            return (
              <button
                key={category.id}
                aria-current={isActive ? "true" : undefined}
                className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#fff1e5] text-[#ef6216] shadow-[0_10px_26px_rgba(242,107,33,0.16)]"
                    : "bg-white/55 text-[#785740] hover:bg-[#fff1e5] hover:text-[#ef6216]"
                }`}
                onClick={() => onSelect(category.id)}
                type="button"
              >
                <span aria-hidden="true">{getCategoryIcon(category.name)}</span>
                <span>{category.name}</span>
                {isActive ? (
                  <span className="absolute inset-x-4 -bottom-1 h-[2px] rounded-full bg-[#ef6216]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
