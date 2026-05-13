import type { OperationalSummary, OrderItemUnitStatus } from "@/lib/order-operations";

export type OrderStatus =
  | "novo"
  | "em_preparo"
  | "pronto"
  | "saiu_para_entrega"
  | "entregue"
  | "fechado"
  | "cancelado";

export type OrderType = "delivery" | "retirada" | "local";
export type OrderChannel = "web" | "whatsapp" | "local";

export type PaymentMethod =
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "pix"
  | "outro"
  | null;

export type UnitActionStatus = "em_preparo" | "pronto" | "entregue" | "cancelado";

export type DashboardOrderDetail = {
  id: string;
  code: string;
  channel: OrderChannel;
  type: OrderType;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  totalAmount: number | string;
  subtotalAmount: number | string;
  deliveryFeeAmount: number | string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  createdAt: string;
  acceptedAt: string | null;
  preparedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  comanda?: {
    id: string;
    code: string;
    name: string | null;
    notes: string | null;
    totalAmount: number | string;
    entries: Array<{ id: string }>;
    operationalSummary?: OperationalSummary;
  } | null;
  operationalSummary: OperationalSummary;
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string | null;
    reference?: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    subtotalAmount: number | string;
    notes: string | null;
    menuItem: {
      name: string;
      imageUrl?: string | null;
    };
    selectedOptions: Array<{
      quantity: number;
      unitPriceDelta: number | string;
      optionItem: {
        name: string;
      };
    }>;
    ingredientCustomizations: Array<{
      quantity: number;
      ingredient: {
        name: string;
      };
    }>;
    units: Array<{
      id: string;
      sequence: number;
      status: OrderItemUnitStatus;
      startedAt?: string | null;
      readyAt?: string | null;
      deliveredAt?: string | null;
      cancelledAt?: string | null;
    }>;
    operationalSummary: OperationalSummary;
  }>;
  statusEvents: Array<{
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    note: string | null;
    createdAt: string;
    changedBy?: {
      name?: string | null;
      email?: string | null;
    } | null;
  }>;
};

export type OrderAction = {
  toStatus: OrderStatus;
  label: string;
  tone?: "primary" | "success" | "neutral" | "danger";
};

export type DashboardOrderDetailSheetProps = {
  order: DashboardOrderDetail | null;
  loading: boolean;
  onClose: () => void;
  onTransition: (toStatus: OrderStatus) => Promise<void>;
  onUnitTransition: (input: {
    orderId: string;
    itemId: string;
    unitId: string;
    toStatus: UnitActionStatus;
  }) => Promise<void>;
  pendingStatus: OrderStatus | null;
  pendingUnitId: string | null;
  feedback: string | null;
  error: string | null;
};
