import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Typography } from "@/components/ui/typography";
import { OrderCard } from "./order-card";
import type { ColumnConfig, OrderSummary } from "./types";

export function KanbanColumn({
  column,
  orders,
  loading,
  allowDrop,
  canDragOrder,
  onOpen,
}: {
  column: ColumnConfig;
  orders: OrderSummary[];
  loading: boolean;
  allowDrop: boolean;
  canDragOrder?: (order: OrderSummary) => boolean;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status, disabled: !allowDrop });

  return (
    <article
      ref={setNodeRef}
      className={`flex w-[18rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border-t-4 ${column.accent} border-x border-b border-[var(--line)] bg-[var(--surface)] shadow-sm transition-all ${
        isOver ? "ring-2 ring-[var(--brand-orange)]/50 ring-offset-2 scale-[1.01]" : ""
      }`}
    >
      <div className={`flex items-center justify-between gap-2 px-4 py-3 ${column.headerBg}`}>
        <Typography variant="title-sm">{column.label}</Typography>
        <Badge className={column.countBg}>
          {orders.length}
        </Badge>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ minHeight: "14rem", maxHeight: "calc(100vh - 18rem)" }}>
        {loading && !orders.length ? (
          <EmptyState className="px-3 py-6 text-xs">Carregando…</EmptyState>
        ) : orders.length ? (
          orders.map((order) => (
            <OrderCard
              draggable={canDragOrder ? canDragOrder(order) : true}
              key={order.id}
              order={order}
              onOpen={() => onOpen(order.id)}
            />
          ))
        ) : (
          <EmptyState className="px-3 py-6 text-xs">{isOver ? "Solte aqui" : "Vazio"}</EmptyState>
        )}
      </div>
    </article>
  );
}
