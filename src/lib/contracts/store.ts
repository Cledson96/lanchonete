import type { MenuWeekday } from "@/lib/menu-item-availability";

export type StoreStatusWindow = {
  weekday: MenuWeekday;
  label: string;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
};

export type StoreStatus = {
  isOpen: boolean;
  currentWeekday: MenuWeekday;
  hoursLabel: string;
  currentWindow: StoreStatusWindow | null;
};

export type StoreProfileSummary = {
  id: string;
  slug: string;
  name: string;
  zipCode?: string | null;
  street: string;
  number: string;
  neighborhood?: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  maxDeliveryDistanceKm: number;
};

export type StoreBusinessHour = {
  id: string;
  weekday: MenuWeekday;
  label: string;
  short: string;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
};

export type DeliveryRule = {
  id: string;
  label: string;
  neighborhood?: string | null;
  city: string;
  state: string;
  zipCodeStart?: string | null;
  zipCodeEnd?: string | null;
  maxDistanceKm: number;
  feeAmount: number;
  minimumOrderAmount?: number | null;
  freeAboveAmount?: number | null;
  estimatedMinMinutes?: number | null;
  estimatedMaxMinutes?: number | null;
  sortOrder: number;
  isActive: boolean;
};

export type StoreSettings = {
  store: {
    name: string;
    zipCode?: string | null;
    street: string;
    number: string;
    neighborhood?: string | null;
    city: string;
    state: string;
    maxDeliveryDistanceKm: number;
  };
  businessHours: StoreBusinessHour[];
  deliveryRules: DeliveryRule[];
  status: StoreStatus;
};
