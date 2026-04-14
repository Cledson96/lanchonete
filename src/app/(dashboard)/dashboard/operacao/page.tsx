import { DashboardOrdersWorkspace } from "@/components/dashboard-orders-workspace";

export default function DashboardOperationPage() {
  return (
    <DashboardOrdersWorkspace
      description="Acompanhe todos os pedidos em tempo real: novos, em preparo, prontos e saindo para entrega em um unico fluxo."
      title="Operacao"
      view="operation"
    />
  );
}