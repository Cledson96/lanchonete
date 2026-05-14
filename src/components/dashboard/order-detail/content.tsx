import type { ReactNode } from "react";
import { Typography } from "@/components/ui/typography";
import { OrderItemsSection } from "./items-section";
import { KitchenItemDetailSection } from "./kitchen-item-section";
import {
  ComandaSection,
  CustomerNotesSection,
  CustomerSection,
  DeliveryAddressSection,
  FinancialSummarySection,
  OperationalSummarySection,
} from "./summary-sections";
import { TimelineSection } from "./timeline-section";
import type {
  DashboardOrderDetail,
  DashboardOrderDetailSheetProps,
  KitchenItemDetailTarget,
  UnitActionScope,
} from "./types";

export function OrderDetailContent({
  order,
  loading,
  actionScope,
  kitchenItemTarget,
  pendingStatus,
  pendingUnitId,
  onUnitTransition,
}: {
  order: DashboardOrderDetail | null;
  loading: boolean;
  actionScope: UnitActionScope;
  kitchenItemTarget?: KitchenItemDetailTarget | null;
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

  if (kitchenItemTarget) {
    return (
      <div className="space-y-3 p-5">
        <KitchenItemDetailSection
          onUnitTransition={onUnitTransition}
          order={order}
          pendingStatus={pendingStatus}
          pendingUnitId={pendingUnitId}
          target={kitchenItemTarget}
        />

        <CollapsedSection title="Resumo do pedido e comanda">
          <div className="space-y-3">
            <ComandaSection order={order} />
            <OperationalSummarySection order={order} />
            <FinancialSummarySection order={order} />
          </div>
        </CollapsedSection>

        <CollapsedSection title="Cliente e entrega">
          <div className="space-y-3">
            <CustomerSection order={order} />
            <DeliveryAddressSection order={order} />
            <CustomerNotesSection order={order} />
          </div>
        </CollapsedSection>

        <CollapsedSection title="Todos os itens do pedido">
          <OrderItemsSection
            actionScope="kitchen"
            onUnitTransition={onUnitTransition}
            order={order}
            pendingStatus={pendingStatus}
            pendingUnitId={pendingUnitId}
            totalItems={totalItems}
          />
        </CollapsedSection>

        <CollapsedSection title="Histórico do pedido">
          <TimelineSection order={order} />
        </CollapsedSection>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5">
      <CustomerSection order={order} />
      <ComandaSection order={order} />
      <OperationalSummarySection order={order} />
      <FinancialSummarySection order={order} />
      <DeliveryAddressSection order={order} />
      <CustomerNotesSection order={order} />
      <OrderItemsSection
        actionScope={actionScope}
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

function CollapsedSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <details className="group rounded-xl border border-[var(--line)] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <Typography variant="title-sm">{title}</Typography>
        <span className="text-sm font-bold text-[var(--muted)] transition group-open:rotate-180">v</span>
      </summary>
      <div className="border-t border-[var(--line)] bg-[var(--background)]/35 p-3">
        {children}
      </div>
    </details>
  );
}
