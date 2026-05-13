import { getCheckoutErrorMessage, type CheckoutApiErrorPayload } from "@/lib/checkout/errors";

export type CheckoutJsonReader = <T>(input: RequestInfo, init?: RequestInit) => Promise<T>;

export const readCheckoutJson: CheckoutJsonReader = async <T>(
  input: RequestInfo,
  init?: RequestInit,
) => {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as
    | CheckoutApiErrorPayload
    | T
    | null;

  if (!response.ok) {
    throw new Error(getCheckoutErrorMessage(payload as CheckoutApiErrorPayload | null));
  }

  return payload as T;
};
