import { ComandaMenuLauncher } from "@/components/comanda/menu-launcher";
import type { PublicMenuCategory } from "@/lib/contracts/menu";
import type { ComandaDetail } from "@/lib/comanda-ui";
import { CloseIcon } from "./icons";
import type { AddComandaItemInput } from "./types";

export function AddItemModal({
  categories,
  canEdit,
  selectedComanda,
  onAddItem,
  onClose,
}: {
  categories: PublicMenuCategory[];
  canEdit: boolean;
  selectedComanda: ComandaDetail;
  onAddItem: (input: AddComandaItemInput) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(45,24,11,0.4)] backdrop-blur-[3px] sm:items-center sm:p-4">
      <button aria-label="Fechar" className="absolute inset-0" onClick={onClose} type="button" />
      <div className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-[var(--line)] bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Lançamento manual
            </p>
            <h3 className="mt-0.5 text-base font-bold leading-tight">
              {selectedComanda.name || selectedComanda.customerProfile?.fullName || "Comanda"}
            </h3>
          </div>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <ComandaMenuLauncher
            categories={categories}
            disabled={!canEdit}
            disabledMessage="Esta comanda foi encerrada e não aceita novos lançamentos."
            onAddItem={onAddItem}
          />
        </div>
      </div>
    </div>
  );
}
