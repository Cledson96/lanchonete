import { Prisma } from "@prisma/client";
import type {
  CheckoutAddress,
  CheckoutCustomerSnapshot,
  CheckoutOrderSummary,
  CheckoutVerificationCustomer,
} from "@/lib/contracts/checkout";
import type { OrderType, PaymentMethod } from "@/lib/contracts/common";

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

function toNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value instanceof Prisma.Decimal) {
    return Number(value);
  }

  return Number(value ?? 0);
}

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
    totalAmount: toNumber(order.totalAmount),
    subtotalAmount: toNumber(order.subtotalAmount),
    deliveryFeeAmount: toNumber(order.deliveryFeeAmount),
  };
}
