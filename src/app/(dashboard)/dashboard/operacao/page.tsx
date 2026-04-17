import { DashboardOrdersWorkspace } from "@/components/dashboard-orders-workspace";

export default function DashboardOperationPage() {
  return (
    <DashboardOrdersWorkspace
      description="Arraste os cards entre as colunas para mover o status. Novos, em preparo, prontos e saindo num só fluxo."
      title="Operação"
      view="operation"
    />
  );
}
