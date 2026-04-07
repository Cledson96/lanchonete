import { DashboardOrdersWorkspace } from "@/components/dashboard-orders-workspace";

export default function DashboardKitchenPage() {
  return (
    <DashboardOrdersWorkspace
      description="Receba os pedidos novos, acompanhe os aceitos e organize o preparo sem misturar a fila quente com relatorios."
      title="Cozinha"
      view="kitchen"
    />
  );
}
