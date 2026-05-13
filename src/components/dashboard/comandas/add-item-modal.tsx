import { ComandaMenuLauncher } from "@/components/comanda/menu-launcher";
import { Modal } from "@/components/ui/modal";
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
    <Modal
      bodyClassName="min-h-0 flex-1 overflow-y-auto p-5"
      closeIcon={<CloseIcon />}
      contentClassName="flex max-h-[92dvh] flex-col"
      eyebrow="Lançamento manual"
      headerClassName="items-center border-b border-[var(--line)] px-5 py-4"
      onClose={onClose}
      placement="bottom"
      size="lg"
      title={selectedComanda.name || selectedComanda.customerProfile?.fullName || "Comanda"}
    >
      <ComandaMenuLauncher
        categories={categories}
        disabled={!canEdit}
        disabledMessage="Esta comanda foi encerrada e não aceita novos lançamentos."
        onAddItem={onAddItem}
      />
    </Modal>
  );
}
