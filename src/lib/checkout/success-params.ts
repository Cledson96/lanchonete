import type { CheckoutOrderSummary } from "@/lib/contracts/checkout";
import type { OrderType, PaymentMethod } from "@/lib/contracts/common";

type CheckoutSuccessSearchParamsInput = {
  code?: string;
  name?: string;
  type?: string;
  payment?: string;
  total?: string;
};

function coerceSearchParamNumber(value?: string) {
  if (value == null || value === "") {
    return 0;
  }

  return Number(value);
}

export function buildCheckoutSuccessParams(
  order: CheckoutOrderSummary,
  fallbackCustomerName?: string,
) {
  return new URLSearchParams({
    code: order.code,
    name: order.customerName || fallbackCustomerName || "",
    type: order.type,
    payment: order.paymentMethod,
    total: String(order.totalAmount),
  });
}

export function parseCheckoutSuccessParams(params: CheckoutSuccessSearchParamsInput) {
  return {
    code: params.code,
    name: params.name,
    type: params.type as OrderType | undefined,
    payment: params.payment as PaymentMethod | undefined,
    totalAmount: coerceSearchParamNumber(params.total),
  };
}
