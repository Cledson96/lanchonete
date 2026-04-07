import { DashboardOrdersWorkspace } from "@/components/dashboard-orders-workspace";

export default function DashboardOrdersArchivePage() {
  return (
    <DashboardOrdersWorkspace
      description="Consulte pedidos entregues, fechados e cancelados quando precisar revisar atendimento, conferir historico ou validar ocorrencias."
      title="Arquivo de pedidos"
      view="archive"
    />
  );
}
