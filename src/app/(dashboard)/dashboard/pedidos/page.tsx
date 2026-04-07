import { listOrders } from "@/lib/services/order-admin-service";
import { formatMoney } from "@/lib/utils";

const columns = ["Codigo", "Canal", "Status", "Cliente", "Total"];

export default async function DashboardPedidosPage() {
  const orders = await listOrders();

  return (
    <main className="panel shadow-sm transition hover:shadow-md hover:border-[var(--brand-orange)]/30 rounded-[2rem] border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--foreground)]">
      <p className="eyebrow mb-3 text-[var(--muted)]">Fila operacional</p>
      <h1 className="text-3xl font-semibold tracking-tight">Pedidos</h1>
      <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[var(--line)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-[var(--surface)]">
        <div className="grid grid-cols-5 gap-4 border-b border-[var(--line)] bg-[var(--background)] px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest text-[var(--muted)]">
          {columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        {orders.length ? (
          <div className="divide-y divide-[var(--line)]">
            {orders.slice(0, 12).map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-5 items-center gap-4 px-6 py-4 text-[0.9rem] font-medium transition-all hover:bg-[var(--background)]"
              >
                <span className="font-mono text-xs font-bold text-[var(--brand-orange)] bg-[var(--brand-orange)]/10 px-2 py-1 rounded inline-flex w-fit">{order.code.slice(0, 8)}</span>
                <span className="capitalize">{order.channel}</span>
                <span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.75rem] font-bold ${order.status === "novo" ? "bg-amber-100 text-amber-700" : order.status === "em_preparo" ? "bg-blue-100 text-blue-700" : (order.status === "entregue" || order.status === "fechado") ? "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]" : "bg-gray-100 text-gray-700"}`}>
                    {order.status}
                  </span>
                </span>
                <span className="truncate">{order.customerName || order.customerPhone || "Cliente"}</span>
                <span className="font-bold text-[var(--foreground)]">{formatMoney(order.totalAmount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">
            Nenhum pedido criado ainda.
          </div>
        )}
      </div>
    </main>
  );
}
