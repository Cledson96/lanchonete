export type ComandaStatus =
  | "novo"
  | "aceito"
  | "em_preparo"
  | "pronto"
  | "saiu_para_entrega"
  | "entregue"
  | "fechado"
  | "cancelado";

export type PaymentMethod =
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "pix"
  | "outro"
  | null;

export type ComandaDetail = {
  id: string;
  code: string;
  qrCodeSlug: string;
  name: string | null;
  notes: string | null;
  status: ComandaStatus;
  subtotalAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  customerProfile?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
  openedBy?: {
    id: string;
    email: string;
  } | null;
  entries: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    subtotalAmount: number | string;
    notes: string | null;
    createdAt: string;
    menuItem: {
      id: string;
      name: string;
      imageUrl?: string | null;
      description?: string | null;
    };
    selectedOptions: Array<{
      optionItem: {
        id: string;
        name: string;
      };
      quantity: number;
      unitPriceDelta: number | string;
    }>;
  }>;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  menuItems: Array<{
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    price: number | string;
    compareAtPrice?: number | string | null;
    optionGroups: Array<{
      id: string;
      name: string;
      description?: string | null;
      minSelections: number;
      maxSelections?: number | null;
      isRequired: boolean;
      options: Array<{
        id: string;
        name: string;
        description?: string | null;
        priceDelta: number | string;
      }>;
    }>;
  }>;
};

export function canEditComanda(status: ComandaStatus) {
  return status !== "fechado" && status !== "cancelado";
}

export function humanizeComandaStatus(status: ComandaStatus) {
  switch (status) {
    case "novo":
      return "Aberta";
    case "aceito":
      return "Aceita";
    case "em_preparo":
      return "Em preparo";
    case "pronto":
      return "Pronta";
    case "saiu_para_entrega":
      return "Saiu para entrega";
    case "entregue":
      return "Entregue";
    case "fechado":
      return "Fechada";
    case "cancelado":
      return "Cancelada";
    default:
      return status;
  }
}

export function humanizePaymentMethod(value: PaymentMethod) {
  switch (value) {
    case "dinheiro":
      return "Dinheiro";
    case "cartao_credito":
      return "Cartao de credito";
    case "cartao_debito":
      return "Cartao de debito";
    case "pix":
      return "Pix";
    case "outro":
      return "Outro";
    default:
      return "Nao definido";
  }
}

export function statusTone(status: ComandaStatus) {
  switch (status) {
    case "novo":
      return "border-[var(--brand-orange)]/20 bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]";
    case "aceito":
    case "em_preparo":
    case "pronto":
      return "border-[var(--brand-green)]/20 bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]";
    case "fechado":
    case "entregue":
      return "border-[var(--line)] bg-[var(--background)] text-[var(--foreground)]";
    case "cancelado":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-[var(--line)] bg-[var(--background)] text-[var(--foreground)]";
  }
}
