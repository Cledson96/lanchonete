import { getCheckoutErrorMessage, type CheckoutApiErrorPayload } from "@/lib/checkout-client";

export type CheckoutJsonReader = <T>(input: RequestInfo, init?: RequestInit) => Promise<T>;

export const readCheckoutJson: CheckoutJsonReader = async <T>(
  input: RequestInfo,
  init?: RequestInit,
) => {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as CheckoutApiErrorPayload | null;

  if (!response.ok) {
    throw new Error(getCheckoutErrorMessage(payload));
  }

  return payload as T;
};
