import type { DeliveryQuote } from "@/lib/contracts/checkout";
import type { FulfillmentType, PaymentMethod } from "@/lib/contracts/common";
import { isCategoryAvailableNow } from "@/lib/category-availability";
import { digitsOnly } from "@/lib/utils";

type CheckoutAvailabilityItem = {
  categoryAvailability?: {
    availableFrom?: string | null;
    availableUntil?: string | null;
  };
};

export function normalizeCheckoutPhoneForCompare(value: string) {
  const digits = digitsOnly(value);

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function buildCheckoutZipState(input: {
  zipCode: string;
  fulfillmentType: FulfillmentType;
}) {
  const cleanZipCode = digitsOnly(input.zipCode);
  const isZipCodeComplete = cleanZipCode.length === 8;

  return {
    cleanZipCode,
    isZipCodeComplete,
    canEditAddressFields: input.fulfillmentType === "delivery" && isZipCodeComplete,
  };
}

export function hasCheckoutLocationForQuote(input: {
  street: string;
  number: string;
  city: string;
  stateCode: string;
  neighborhood: string;
}) {
  return (
    input.street.trim().length >= 2 &&
    input.number.trim().length >= 1 &&
    input.city.trim().length >= 2 &&
    input.stateCode.trim().length >= 2 &&
    input.neighborhood.trim().length >= 2
  );
}

export function isCheckoutDeliveryAddressValid(input: {
  fulfillmentType: FulfillmentType;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  stateCode: string;
  deliveryQuote: DeliveryQuote | null;
  deliveryQuoteError: string | null;
}) {
  if (input.fulfillmentType !== "delivery") {
    return true;
  }

  return (
    input.street.trim().length >= 2 &&
    input.number.trim().length >= 1 &&
    input.neighborhood.trim().length >= 2 &&
    input.city.trim().length >= 2 &&
    input.stateCode.trim().length === 2 &&
    !!input.deliveryQuote &&
    !input.deliveryQuoteError
  );
}

export function canRequestCheckoutVerification(input: {
  customerPhone: string;
  verificationPending: boolean;
}) {
  return digitsOnly(input.customerPhone).length >= 10 && !input.verificationPending;
}

export function getCheckoutUnavailableItems<T extends CheckoutAvailabilityItem>(items: T[]) {
  return items.filter(
    (item) => item.categoryAvailability && !isCategoryAvailableNow(item.categoryAvailability),
  );
}

export function canSubmitCheckoutOrder(input: {
  itemsCount: number;
  customerName: string;
  customerPhone: string;
  verificationConfirmed: boolean;
  verifiedPhone: string;
  paymentMethod: PaymentMethod;
  isDeliveryAddressValid: boolean;
  isMenuAvailableNow: boolean;
  storeIsOpen: boolean;
  submitPending: boolean;
  deliveryQuoteLoading: boolean;
}) {
  return (
    input.itemsCount > 0 &&
    input.customerName.trim().length >= 2 &&
    digitsOnly(input.customerPhone).length >= 10 &&
    input.verificationConfirmed &&
    input.verifiedPhone === normalizeCheckoutPhoneForCompare(input.customerPhone) &&
    input.paymentMethod &&
    input.isDeliveryAddressValid &&
    input.isMenuAvailableNow &&
    input.storeIsOpen &&
    !input.submitPending &&
    !input.deliveryQuoteLoading
  );
}

export function isCheckoutVerificationExpired(message?: string | null) {
  return message?.includes("expirado") ?? false;
}
