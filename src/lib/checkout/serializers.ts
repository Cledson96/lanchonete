import type { Prisma } from "@prisma/client";
import type {
  CheckoutAddress,
  CheckoutCustomerSnapshot,
  DeliveryDistanceMethod,
  DeliveryQuote,
  DeliveryQuoteRule,
  DeliveryQuoteStore,
  CheckoutOrderSummary,
  CheckoutVerificationCustomer,
} from "@/lib/contracts/checkout";
import type { OrderType, PaymentMethod } from "@/lib/contracts/common";
import { coerceNumber, coerceNullableNumber } from "@/lib/db/decimal";

type CheckoutAddressRecord = {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string | null;
  reference: string | null;
};

type CheckoutCustomerRecord = {
  id: string;
  fullName: string | null;
  phone: string;
  defaultAddress?: CheckoutAddressRecord | null;
  addresses?: CheckoutAddressRecord[];
  orders?: Array<{
    paymentMethod: PaymentMethod | null;
    type: OrderType | null;
  }>;
};

type CheckoutVerificationCustomerRecord = {
  id: string;
  fullName: string | null;
  phone: string;
};

type CheckoutOrderRecord = {
  code: string;
  customerName: string | null;
  customerPhone: string | null;
  type: CheckoutOrderSummary["type"];
  paymentMethod: PaymentMethod;
  totalAmount: Prisma.Decimal | number | string | null;
  subtotalAmount: Prisma.Decimal | number | string | null;
  deliveryFeeAmount: Prisma.Decimal | number | string | null;
};

type CheckoutDeliveryQuoteRecord = {
  serviceable: boolean;
  deliveryFeeRuleId: string;
  feeAmount: Prisma.Decimal | number | string | null;
  distanceKm: Prisma.Decimal | number | string | null;
  distanceMethod?: DeliveryDistanceMethod;
  estimatedMinMinutes?: number | null;
  estimatedMaxMinutes?: number | null;
  rule: {
    id: string;
    label: string;
    city: string;
    state: string;
    neighborhood?: string | null;
    zipCodeStart?: string | null;
    zipCodeEnd?: string | null;
    maxDistanceKm?: Prisma.Decimal | number | string | null;
    feeAmount: Prisma.Decimal | number | string | null;
    minimumOrderAmount?: Prisma.Decimal | number | string | null;
    freeAboveAmount?: Prisma.Decimal | number | string | null;
  };
  store: {
    name: string;
    street?: string;
    number?: string;
    city: string;
    state: string;
    zipCode?: string | null;
    maxDeliveryDistanceKm: Prisma.Decimal | number | string | null;
  };
};

export function serializeCheckoutAddress(address: CheckoutAddressRecord): CheckoutAddress {
  return {
    id: address.id,
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    reference: address.reference,
  };
}

export function serializeCheckoutCustomerSnapshot(
  customer: CheckoutCustomerRecord,
): CheckoutCustomerSnapshot {
  const defaultAddress = customer.defaultAddress || customer.addresses?.[0] || null;
  const lastOrder = customer.orders?.[0] || null;

  return {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
    defaultAddress: defaultAddress ? serializeCheckoutAddress(defaultAddress) : null,
    lastPaymentMethod: lastOrder?.paymentMethod || null,
    lastOrderType: lastOrder?.type || null,
  };
}

export function serializeCheckoutVerificationCustomer(
  customer: CheckoutVerificationCustomerRecord,
): CheckoutVerificationCustomer {
  return {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
  };
}

export function serializeCheckoutOrderSummary(order: CheckoutOrderRecord): CheckoutOrderSummary {
  return {
    code: order.code,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    type: order.type,
    paymentMethod: order.paymentMethod,
    totalAmount: coerceNumber(order.totalAmount),
    subtotalAmount: coerceNumber(order.subtotalAmount),
    deliveryFeeAmount: coerceNumber(order.deliveryFeeAmount),
  };
}

function serializeCheckoutDeliveryQuoteRule(
  rule: CheckoutDeliveryQuoteRecord["rule"],
): DeliveryQuoteRule {
  return {
    id: rule.id,
    label: rule.label,
    city: rule.city,
    state: rule.state,
    neighborhood: rule.neighborhood,
    zipCodeStart: rule.zipCodeStart,
    zipCodeEnd: rule.zipCodeEnd,
    maxDistanceKm: coerceNullableNumber(rule.maxDistanceKm),
    feeAmount: coerceNumber(rule.feeAmount),
    minimumOrderAmount: coerceNullableNumber(rule.minimumOrderAmount),
    freeAboveAmount: coerceNullableNumber(rule.freeAboveAmount),
  };
}

function serializeCheckoutDeliveryQuoteStore(
  store: CheckoutDeliveryQuoteRecord["store"],
): DeliveryQuoteStore {
  return {
    name: store.name,
    street: store.street,
    number: store.number,
    city: store.city,
    state: store.state,
    zipCode: store.zipCode,
    maxDeliveryDistanceKm: coerceNumber(store.maxDeliveryDistanceKm),
  };
}

export function serializeCheckoutDeliveryQuote(
  quote: CheckoutDeliveryQuoteRecord,
): DeliveryQuote {
  return {
    serviceable: quote.serviceable,
    deliveryFeeRuleId: quote.deliveryFeeRuleId,
    feeAmount: coerceNumber(quote.feeAmount),
    distanceKm: coerceNumber(quote.distanceKm),
    distanceMethod: quote.distanceMethod,
    estimatedMinMinutes: quote.estimatedMinMinutes ?? null,
    estimatedMaxMinutes: quote.estimatedMaxMinutes ?? null,
    rule: serializeCheckoutDeliveryQuoteRule(quote.rule),
    store: serializeCheckoutDeliveryQuoteStore(quote.store),
  };
}
