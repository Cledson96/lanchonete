import { actionClassName, getActions } from "./helpers";
import type { DashboardOrderDetail, OrderStatus } from "./types";

export function OrderDetailFooter({
  order,
  loading,
  pendingStatus,
  feedback,
  error,
  onTransition,
}: {
  order: DashboardOrderDetail | null;
  loading: boolean;
  pendingStatus: OrderStatus | null;
  feedback: string | null;
  error: string | null;
  onTransition: (toStatus: OrderStatus) => Promise<void>;
}) {
  if (!order || loading) return null;

  const actions = getActions(order);

  return (
    <footer className="sticky bottom-0 shrink-0 border-t border-[var(--line)] bg-white p-4 shadow-[0_-4px_20px_rgba(45,24,11,0.06)]">
      {feedback ? (
        <div className="mb-2.5 rounded-lg border border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 px-3 py-2 text-xs font-medium text-[var(--brand-green-dark)]">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="mb-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {actions.length ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.toStatus}
              className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${actionClassName(action.tone)}`}
              disabled={pendingStatus !== null}
              onClick={() => void onTransition(action.toStatus)}
              type="button"
            >
              {pendingStatus === action.toStatus ? "Atualizando…" : action.label}
            </button>
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
