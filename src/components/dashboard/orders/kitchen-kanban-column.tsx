import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Typography } from "@/components/ui/typography";
import { KitchenItemCard } from "./kitchen-item-card";
import type { KitchenColumnConfig, KitchenItemCardData } from "./types";

export function KitchenKanbanColumn({
  column,
  items,
  loading,
  onOpen,
}: {
  column: KitchenColumnConfig;
  items: KitchenItemCardData[];
  loading: boolean;
  onOpen: (orderId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <article ref={setNodeRef} className={`flex w-[18rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border-t-4 ${column.accent} border-x border-b border-[var(--line)] bg-[var(--surface)] shadow-sm transition-all ${isOver ? "ring-2 ring-[var(--brand-orange)]/50 ring-offset-2 scale-[1.01]" : ""}`}>
      <div className={`flex items-center justify-between gap-2 px-4 py-3 ${column.headerBg}`}>
        <Typography variant="title-sm">{column.label}</Typography>
        <Badge className={column.countBg}>{items.length}</Badge>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ minHeight: "14rem", maxHeight: "calc(100vh - 18rem)" }}>
        {loading && !items.length ? (
          <EmptyState className="px-3 py-6 text-xs">Carregando…</EmptyState>
        ) : items.length ? (
          items.map((item) => <KitchenItemCard key={item.id} item={item} onOpen={onOpen} />)
        ) : (
          <EmptyState className="px-3 py-6 text-xs">{isOver ? "Solte aqui" : "Vazio"}</EmptyState>
        )}
      </div>
    </article>
  );
}
