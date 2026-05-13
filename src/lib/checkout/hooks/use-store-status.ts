import { useEffect, useState } from "react";
import type { CheckoutStoreStatus } from "@/lib/contracts/checkout";
import type { CheckoutJsonReader } from "@/lib/checkout/api-client";
import { brandContent } from "@/lib/brand-content";
import { getCurrentWeekday } from "@/lib/menu/availability";

type UseCheckoutStoreStatusInput = {
  initialStoreStatus?: CheckoutStoreStatus;
  readJson: CheckoutJsonReader;
};

function buildFallbackStoreStatus(): CheckoutStoreStatus {
  return {
    isOpen: true,
    currentWeekday: getCurrentWeekday(),
    hoursLabel: brandContent.hours,
    currentWindow: null,
  };
}

export function useCheckoutStoreStatus(input: UseCheckoutStoreStatusInput) {
  const { initialStoreStatus, readJson } = input;
  const [storeStatus, setStoreStatus] = useState<CheckoutStoreStatus>(
    initialStoreStatus || buildFallbackStoreStatus(),
  );

  useEffect(() => {
    let cancelled = false;

    readJson<CheckoutStoreStatus>("/api/store/status", { cache: "no-store" })
      .then((payload) => {
        if (!cancelled) {
          setStoreStatus(payload);
        }
      })
      .catch(() => {
        // Backend validation remains authoritative if this refresh fails.
      });

    return () => {
      cancelled = true;
    };
  }, [readJson]);

  return {
    storeStatus,
  };
}
