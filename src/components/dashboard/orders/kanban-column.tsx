import { useDroppable } from "@dnd-kit/core";
import { OrderCard } from "./order-card";
import type { ColumnConfig, OrderSummary } from "./types";

export function KanbanColumn({
  column,
  orders,
  loading,
  allowDrop,
  onOpen,
}: {
  column: ColumnConfig;
  orders: OrderSummary[];
  loading: boolean;
  allowDrop: boolean;
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
        <p className="text-sm font-bold tracking-tight">{column.label}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${column.countBg}`}>
          {orders.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ minHeight: "14rem", maxHeight: "calc(100vh - 18rem)" }}>
        {loading && !orders.length ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--muted)]">
            Carregando…
          </div>
        ) : orders.length ? (
          orders.map((order) => <OrderCard key={order.id} order={order} onOpen={() => onOpen(order.id)} />)
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--muted)]">
            {isOver ? "Solte aqui" : "Vazio"}
          </div>
        )}
      </div>
    </article>
  );
}
