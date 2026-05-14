import { DashboardOrdersWorkspace } from "@/components/dashboard/orders-workspace";

export default function DashboardOperationPage() {
  return (
    <DashboardOrdersWorkspace
      description="Acompanhe pedidos e comandas por status, com contexto completo para atendimento e expedicao."
      title="Operação"
      view="operation"
    />
  );
}
