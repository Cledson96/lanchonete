import { DashboardOrdersWorkspace } from "@/components/dashboard/orders-workspace";

export default function DashboardCozinhaPage() {
  return (
    <DashboardOrdersWorkspace
      description="Visualize a fila por item e mova o preparo conforme a cozinha avanca."
      title="Cozinha"
      view="kitchen"
    />
  );
}
