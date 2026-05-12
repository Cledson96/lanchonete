import type { OrderType, PaymentMethod } from "@/lib/contracts/common";
import type { StoreStatus } from "@/lib/contracts/store";

export type DeliveryDistanceMethod = "same_address" | "route";

export type DeliveryQuoteRule = {
  id: string;
  label: string;
  city: string;
  state: string;
  neighborhood?: string | null;
  zipCodeStart?: string | null;
  zipCodeEnd?: string | null;
  maxDistanceKm?: number | null;
  feeAmount: number;
  minimumOrderAmount?: number | null;
  freeAboveAmount?: number | null;
};

export type DeliveryQuoteStore = {
  name: string;
  street?: string;
  number?: string;
  city: string;
  state: string;
  zipCode?: string | null;
  maxDeliveryDistanceKm: number;
};

export type CheckoutAddress = {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string | null;
  reference?: string | null;
};

export type DeliveryQuote = {
  serviceable: boolean;
  deliveryFeeRuleId: string;
  feeAmount: number;
  distanceKm: number;
  distanceMethod?: DeliveryDistanceMethod;
  estimatedMinMinutes?: number | null;
  estimatedMaxMinutes?: number | null;
  rule: DeliveryQuoteRule;
  store: DeliveryQuoteStore;
};

export type ViaCepResponse = {
  zipCode: string;
  street: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
};

export type RequestVerificationResponse = {
  phone: string;
  expiresAt: string;
  delivered: boolean;
  provider: "baileys" | "development";
  devCodePreview?: string;
};

export type ConfirmVerificationResponse = {
  customer: CheckoutVerificationCustomer;
};

export type CheckoutVerificationCustomer = {
  id: string;
  fullName?: string | null;
  phone: string;
};

export type CheckoutCustomerSnapshot = {
  id: string;
  fullName?: string | null;
  phone: string;
  defaultAddress?: CheckoutAddress | null;
  lastPaymentMethod?: PaymentMethod | null;
  lastOrderType?: OrderType | null;
};

export type CustomerMeResponse = {
  customer: CheckoutCustomerSnapshot | null;
};

export type CheckoutOrderSummary = {
  code: string;
  customerName?: string | null;
  customerPhone?: string | null;
  type: OrderType;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  subtotalAmount: number;
  deliveryFeeAmount: number;
};

export type CreateOrderResponse = {
  order: CheckoutOrderSummary;
};

export type CheckoutStoreStatus = StoreStatus;
