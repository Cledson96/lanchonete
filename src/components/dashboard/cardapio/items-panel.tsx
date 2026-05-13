import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Typography } from "@/components/ui/typography";
import { formatMenuWeekdays } from "@/lib/menu/availability";
import { resolveMenuItemImage } from "@/lib/menu/images.shared";
import { formatMoney } from "@/lib/utils";
import { asNumber } from "./helpers";
import { EditIcon, ImageIcon, SearchIcon, TrashIcon } from "./icons";
import type { CategorySummary, NormalizedMenuItem } from "./types";

type ItemsPanelProps = {
  categoryList: CategorySummary[];
  items: NormalizedMenuItem[];
  onEditItem: (id: string | null) => void;
  onRemoveImage: (id: string) => Promise<void>;
  onSearchChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "active" | "inactive") => void;
  onToggleActive: (item: NormalizedMenuItem) => Promise<void>;
  onUpload: (id: string, file: File | null) => Promise<void>;
  removingItemId: string | null;
  search: string;
  selectedCategory: string;
  statusFilter: "all" | "active" | "inactive";
  totalItems: number;
  uploadingItemId: string | null;
  fileInputsRef: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
};

export function ItemsPanel({
  categoryList,
  items,
  onEditItem,
  onRemoveImage,
  onSearchChange,
  onSelectedCategoryChange,
  onStatusFilterChange,
  onToggleActive,
  onUpload,
  removingItemId,
  search,
  selectedCategory,
  statusFilter,
  totalItems,
  uploadingItemId,
  fileInputsRef,
}: ItemsPanelProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <SearchIcon />
          </span>
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--brand-orange)]"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, categoria ou descrição…"
            value={search}
          />
        </div>
        <select
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-orange)]"
          onChange={(e) => onSelectedCategoryChange(e.target.value)}
          value={selectedCategory}
        >
          <option value="all">Todas as categorias</option>
          {categoryList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-xl border border-[var(--line)]">
          {(["all", "active", "inactive"] as const).map((value) => (
            <button
              key={value}
              className={`px-3 py-2 text-xs font-semibold transition ${
                statusFilter === value
                  ? "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                  : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => onStatusFilterChange(value)}
              type="button"
            >
              {value === "all" ? "Todos" : value === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState className="bg-[var(--surface)] px-4 py-12">
          {totalItems === 0
            ? "Nenhum item cadastrado. Clique em 'Novo item' para começar."
            : "Nenhum item bate com os filtros. Ajuste a busca ou categoria."}
        </EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              fileInputsRef={fileInputsRef}
              item={item}
              onEdit={() => onEditItem(item.id)}
              onRemoveImage={() => void onRemoveImage(item.id)}
              onToggleActive={() => void onToggleActive(item)}
              onUpload={(file) => void onUpload(item.id, file)}
              removing={removingItemId === item.id}
              uploading={uploadingItemId === item.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type ItemCardProps = {
  fileInputsRef: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  item: NormalizedMenuItem;
  onEdit: () => void;
  onRemoveImage: () => void;
  onToggleActive: () => void;
  onUpload: (file: File | null) => void;
  removing: boolean;
  uploading: boolean;
};

function ItemCard({
  fileInputsRef,
  item,
  onEdit,
  onRemoveImage,
  onToggleActive,
  onUpload,
  removing,
  uploading,
}: ItemCardProps) {
  const price = asNumber(item.price) ?? 0;
  const comparePrice = asNumber(item.compareAtPrice);
  const optionCount = (item.optionGroups || []).length;
  const comboCount = (item.comboItems || []).length;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-sm transition hover:border-[var(--brand-orange)]/40 hover:shadow-md ${
        item.isActive ? "border-[var(--line)]" : "border-[var(--line)] opacity-75"
      }`}
    >
      <div className="relative h-36 w-full bg-[var(--background)]">
        <Image alt={item.name} className="object-cover" fill sizes="320px" src={resolveMenuItemImage(item.imageUrl)} />
        {!item.imageUrl ? (
          <Badge className="absolute bottom-2 left-2 bg-white/92 px-2 py-0.5 text-[0.6rem] uppercase shadow-sm" tone="neutral">
            Sem foto
          </Badge>
        ) : null}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge className="bg-white/95 px-2 py-0.5 text-[0.6rem] uppercase text-[var(--foreground)]">
            {item.category.name}
          </Badge>
          {item.kind === "combo" ? (
            <Badge className="bg-[var(--brand-orange)] px-2 py-0.5 text-[0.6rem] uppercase text-white">
              combo
            </Badge>
          ) : null}
        </div>
        {!item.isActive || item.isFeatured || item.availableWeekdays?.length ? (
          <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-1">
            {!item.isActive ? (
              <Badge className="bg-red-500/95 px-2 py-0.5 text-[0.6rem] uppercase text-white">
                Inativo
              </Badge>
            ) : null}
            {item.isFeatured ? (
              <Badge className="bg-amber-400 px-2 py-0.5 text-[0.6rem] uppercase text-amber-900">
                Destaque
              </Badge>
            ) : null}
            {item.availableWeekdays?.length ? (
              <Badge className="bg-[var(--brand-green)] px-2 py-0.5 text-[0.6rem] uppercase text-white">
                {formatMenuWeekdays(item.availableWeekdays)}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Typography as="h3" className="leading-tight" variant="title-sm">{item.name}</Typography>
          <div className="shrink-0 text-right">
            <Typography tone="orange" variant="body-sm">{formatMoney(price)}</Typography>
            {comparePrice ? (
              <Typography className="line-through" tone="muted" variant="caption-sm">{formatMoney(comparePrice)}</Typography>
            ) : null}
          </div>
        </div>

        {item.description ? (
          <Typography className="line-clamp-2 leading-5" tone="muted" variant="caption">{item.description}</Typography>
        ) : null}

        {optionCount > 0 || comboCount > 0 ? (
          <div className="flex flex-wrap gap-1">
            {optionCount > 0 ? (
              <Badge className="rounded-md px-1.5 py-0.5 text-[0.6rem]" tone="success">
                {optionCount} {optionCount === 1 ? "grupo" : "grupos"} de opcionais
              </Badge>
            ) : null}
            {comboCount > 0 ? (
              <Badge className="rounded-md px-1.5 py-0.5 text-[0.6rem]" tone="orange">
                {comboCount} {comboCount === 1 ? "item" : "itens"} no combo
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-1 border-t border-[var(--line)] pt-2">
          <Button
            className="flex-1 rounded-lg px-2 py-1.5 text-xs"
            onClick={onEdit}
            size="xs"
          >
            <EditIcon />
            Editar
          </Button>
          <Button
            className="rounded-lg px-2 py-1.5 text-xs"
            onClick={onToggleActive}
            size="xs"
            title={item.isActive ? "Desativar" : "Ativar"}
            variant="secondary"
          >
            {item.isActive ? "Pausar" : "Ativar"}
          </Button>
          <label
            className="flex cursor-pointer items-center justify-center rounded-lg border border-[var(--line)] p-1.5 text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
            title={item.imageUrl ? "Trocar imagem" : "Enviar imagem"}
          >
            {uploading ? <span className="px-1 text-[0.6rem]">…</span> : <ImageIcon />}
            <input
              accept="image/*"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0] || null)}
              ref={(node) => {
                fileInputsRef.current[item.id] = node;
              }}
              type="file"
            />
          </label>
          {item.imageUrl ? (
            <Button
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
              disabled={removing}
              onClick={onRemoveImage}
              size="xs"
              title="Remover imagem"
              variant="unstyled"
            >
              <TrashIcon />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function CategoriesPanel({
  categories,
  onDelete,
  onEdit,
}: {
  categories: Array<CategorySummary & { itemCount: number }>;
  onDelete: (c: CategorySummary & { itemCount: number }) => void;
  onEdit: (c?: CategorySummary) => void;
}) {
  if (categories.length === 0) {
    return (
      <EmptyState className="bg-[var(--surface)] px-4 py-12">
        Nenhuma categoria cadastrada. Clique em &quot;Nova categoria&quot; para começar.
      </EmptyState>
    );
  }

  return (
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <article
          className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition hover:border-[var(--brand-orange)]/40"
          key={category.id}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-bold leading-tight">{category.name}</h3>
                {!category.isActive ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[0.6rem] font-bold text-red-700">
                    Inativa
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">/{category.slug}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--brand-orange)]/10 px-2 py-0.5 text-[0.65rem] font-bold text-[var(--brand-orange-dark)]">
              {category.itemCount} {category.itemCount === 1 ? "item" : "itens"}
            </span>
          </div>

          {category.description ? (
            <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">{category.description}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] text-[var(--muted)]">
            <span>Ordem {category.sortOrder}</span>
            {category.availableFrom || category.availableUntil ? (
              <span>
                · {category.availableFrom || "00:00"}–{category.availableUntil || "23:59"}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex gap-1.5 border-t border-[var(--line)] pt-3">
            <button
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--line)] px-2 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
              onClick={() => onEdit(category)}
              type="button"
            >
              <EditIcon />
              Editar
            </button>
            <button
              className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
              onClick={() => onDelete(category)}
              type="button"
            >
              <TrashIcon />
              Excluir
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
