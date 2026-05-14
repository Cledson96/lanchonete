import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { actionClassName, getActions } from "./helpers";
import type { DashboardOrderDetail, KitchenItemDetailTarget, OrderStatus, UnitActionScope } from "./types";

export function OrderDetailFooter({
  order,
  loading,
  actionScope,
  kitchenItemTarget,
  pendingStatus,
  feedback,
  error,
  onTransition,
}: {
  order: DashboardOrderDetail | null;
  loading: boolean;
  actionScope: UnitActionScope;
  kitchenItemTarget?: KitchenItemDetailTarget | null;
  pendingStatus: OrderStatus | null;
  feedback: string | null;
  error: string | null;
  onTransition: (toStatus: OrderStatus) => Promise<void>;
}) {
  if (!order || loading) return null;

  if (kitchenItemTarget) {
    if (!feedback && !error) return null;

    return (
      <footer className="sticky bottom-0 shrink-0 border-t border-[var(--line)] bg-white p-4 shadow-[0_-4px_20px_rgba(45,24,11,0.06)]">
        {feedback ? <Alert className="mb-2.5" tone="success">{feedback}</Alert> : null}
        {error ? <Alert className="mb-2.5" tone="error">{error}</Alert> : null}
      </footer>
    );
  }

  const actions = getActions(order, actionScope);

  return (
    <footer className="sticky bottom-0 shrink-0 border-t border-[var(--line)] bg-white p-4 shadow-[0_-4px_20px_rgba(45,24,11,0.06)]">
      {feedback ? <Alert className="mb-2.5" tone="success">{feedback}</Alert> : null}
      {error ? <Alert className="mb-2.5" tone="error">{error}</Alert> : null}

      {actions.length ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.toStatus}
              className={`flex-1 ${actionClassName(action.tone)}`}
              disabled={pendingStatus !== null}
              onClick={() => void onTransition(action.toStatus)}
              size="lg"
              variant="unstyled"
            >
              {pendingStatus === action.toStatus ? "Atualizando…" : action.label}
            </Button>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-[var(--background)] px-3 py-2 text-center text-xs text-[var(--muted)]">
          Nenhuma ação disponível para este status.
        </p>
      )}
    </footer>
  );
}
