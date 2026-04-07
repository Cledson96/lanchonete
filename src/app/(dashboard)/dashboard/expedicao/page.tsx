import { DashboardOrdersWorkspace } from "@/components/dashboard-orders-workspace";

export default function DashboardDispatchPage() {
  return (
    <DashboardOrdersWorkspace
      description="Acompanhe pedidos prontos, organize saida para entrega e finalize retiradas no balcao com tudo visivel em um unico fluxo."
      title="Expedicao"
      view="dispatch"
    />
  );
}
