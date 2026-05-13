import { OrderItemsSection } from "./items-section";
import {
  ComandaSection,
  CustomerNotesSection,
  CustomerSection,
  DeliveryAddressSection,
  FinancialSummarySection,
  OperationalSummarySection,
} from "./summary-sections";
import { TimelineSection } from "./timeline-section";
import type { DashboardOrderDetail, DashboardOrderDetailSheetProps } from "./types";

export function OrderDetailContent({
  order,
  loading,
  pendingStatus,
  pendingUnitId,
  onUnitTransition,
}: {
  order: DashboardOrderDetail | null;
  loading: boolean;
  pendingStatus: DashboardOrderDetailSheetProps["pendingStatus"];
  pendingUnitId: string | null;
  onUnitTransition: DashboardOrderDetailSheetProps["onUnitTransition"];
}) {
  if (loading || !order) {
    return (
      <div className="p-5">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          Carregando detalhes…
        </div>
      </div>
    );
  }

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4 p-5">
      <CustomerSection order={order} />
      <ComandaSection order={order} />
      <OperationalSummarySection order={order} />
      <FinancialSummarySection order={order} />
      <DeliveryAddressSection order={order} />
      <CustomerNotesSection order={order} />
      <OrderItemsSection
        onUnitTransition={onUnitTransition}
        order={order}
        pendingStatus={pendingStatus}
        pendingUnitId={pendingUnitId}
        totalItems={totalItems}
      />
      <TimelineSection order={order} />
    </div>
  );
}
