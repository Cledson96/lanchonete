"use client";

import { useEffect } from "react";
import { OrderDetailContent } from "./order-detail/content";
import { OrderDetailFooter } from "./order-detail/footer";
import { OrderDetailHeader } from "./order-detail/header";
import type {
  DashboardOrderDetail,
  DashboardOrderDetailSheetProps,
} from "./order-detail/types";

export type { DashboardOrderDetail } from "./order-detail/types";

export function DashboardOrderDetailSheet({
  order,
  loading,
  actionScope = "operation",
  kitchenItemTarget,
  onClose,
  onTransition,
  onUnitTransition,
  pendingStatus,
  pendingUnitId,
  feedback,
  error,
}: DashboardOrderDetailSheetProps) {
  useEffect(() => {
    if (!order && !loading) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [order, loading, onClose]);

  if (!order && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(45,24,11,0.4)] backdrop-blur-[3px]">
      <button aria-label="Fechar painel" className="flex-1 cursor-default" onClick={onClose} type="button" />

      <aside className="flex h-full w-full max-w-[34rem] flex-col bg-[var(--surface)] text-[var(--foreground)] shadow-[0_24px_80px_rgba(45,24,11,0.24)]">
        <OrderDetailHeader loading={loading} onClose={onClose} order={order as DashboardOrderDetail | null} />

        <div className="flex-1 overflow-y-auto">
          <OrderDetailContent
            actionScope={actionScope}
            kitchenItemTarget={kitchenItemTarget}
            loading={loading}
            onUnitTransition={onUnitTransition}
            order={order}
            pendingStatus={pendingStatus}
            pendingUnitId={pendingUnitId}
          />
        </div>

        <OrderDetailFooter
          actionScope={actionScope}
          error={error}
          feedback={feedback}
          kitchenItemTarget={kitchenItemTarget}
          loading={loading}
          onTransition={onTransition}
          order={order}
          pendingStatus={pendingStatus}
        />
      </aside>
    </div>
  );
}
