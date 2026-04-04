import { listOrders } from "@/lib/services/order-admin-service";
import { formatMoney } from "@/lib/utils";

const columns = ["Codigo", "Canal", "Status", "Cliente", "Total"];

export default async function DashboardPedidosPage() {
  const orders = await listOrders();

  return (
    <main className="panel rounded-[2rem] border-white/10 bg-white/7 p-6 text-white">
      <p className="eyebrow mb-3 text-white/60">Fila operacional</p>
      <h1 className="text-3xl font-semibold tracking-tight">Pedidos</h1>
      <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/10">
        <div className="grid grid-cols-5 gap-4 bg-white/7 px-4 py-3 text-sm text-white/64">
          {columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        {orders.length ? (
          orders.slice(0, 12).map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-5 gap-4 border-t border-white/10 px-4 py-4 text-sm"
            >
              <span>{order.code}</span>
              <span>{order.channel}</span>
              <span>{order.status}</span>
              <span>{order.customerName || order.customerPhone || "Cliente"}</span>
              <span>{formatMoney(order.totalAmount)}</span>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-white/64">
            Nenhum pedido criado ainda.
          </div>
        )}
      </div>
    </main>
  );
}
