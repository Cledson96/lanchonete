import type { OperationalSummary, OrderItemUnitStatus } from "@/lib/order-operations";
import type { DashboardOrderDetail } from "../order-detail-sheet";

export type DashboardOrderView = "operation" | "kitchen" | "dispatch" | "archive";
export type OrderStatus = DashboardOrderDetail["status"];
export type OrderChannel = DashboardOrderDetail["channel"];

export type OrderSummary = {
  id: string;
  code: string;
  channel: OrderChannel;
  type: DashboardOrderDetail["type"];
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  totalAmount: number | string;
  createdAt: string;
  updatedAt: string;
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
  items: Array<{
    id: string;
    quantity: number;
    notes: string | null;
    menuItem: { name: string };
    units: Array<{
      id: string;
      sequence: number;
      status: OrderItemUnitStatus;
    }>;
    operationalSummary: OperationalSummary;
    selectedOptions?: Array<{
      quantity: number;
      optionItem: { name: string };
    }>;
    ingredientCustomizations?: Array<{
      quantity: number;
      ingredient: { name: string };
    }>;
  }>;
};

export type DashboardOrdersWorkspaceProps = {
  view: DashboardOrderView;
  title: string;
  description: string;
};

export type ColumnConfig = {
  status: OrderStatus;
  label: string;
  accent: string;
  headerBg: string;
  countBg: string;
};

export type KitchenItemCardData = {
  id: string;
  orderId: string;
  itemId: string;
  unitId: string;
  orderCode: string;
  unitStatus: OrderItemUnitStatus;
  channel: OrderChannel;
  type: OrderSummary["type"];
  customerName: string | null;
  createdAt: string;
  comandaLabel: string | null;
  orderNotes: string | null;
  itemQuantity: number;
  unitSequence: number;
  name: string;
  itemNotes: string | null;
  optionLines: string[];
  ingredientLines: string[];
};

export type KitchenColumnConfig = ColumnConfig & { status: "novo" | "em_preparo" | "pronto" };
