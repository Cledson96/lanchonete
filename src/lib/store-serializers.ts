import type { Prisma } from "@prisma/client";
import type {
  DeliveryRule,
  StoreBusinessHour,
  StoreProfileSummary,
  StoreSettings,
  StoreStatus,
} from "@/lib/contracts/store";
import { MENU_WEEKDAYS, type MenuWeekday } from "@/lib/menu-item-availability";
import { coerceNullableNumber, coerceNumber, numberFromDecimal } from "@/lib/db/decimal";

const TIME_ZONE = "America/Sao_Paulo";

type StoreProfileRecord = {
  id: string;
  slug: string;
  name: string;
  zipCode?: string | null;
  street: string;
  number: string;
  neighborhood?: string | null;
  city: string;
  state: string;
  latitude?: Prisma.Decimal | null;
  longitude?: Prisma.Decimal | null;
  maxDeliveryDistanceKm: Prisma.Decimal | number | string | null;
};

type StoreBusinessHourRecord = {
  id: string;
  weekday: string;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
};

type StoreDeliveryRuleRecord = {
  id: string;
  label: string;
  neighborhood: string | null;
  city: string;
  state: string;
  zipCodeStart: string | null;
  zipCodeEnd: string | null;
  maxDistanceKm: Prisma.Decimal | number | string | null;
  feeAmount: Prisma.Decimal | number | string | null;
  minimumOrderAmount: Prisma.Decimal | number | string | null;
  freeAboveAmount: Prisma.Decimal | number | string | null;
  estimatedMinMinutes: number | null;
  estimatedMaxMinutes: number | null;
  sortOrder: number;
  isActive: boolean;
};

function parseTimeToMinutes(value: string) {
  const [hourPart, minutePart] = value.split(":");
  return Number(hourPart) * 60 + Number(minutePart);
}

function formatTime(value: string) {
  return value.replace(/^0/, "");
}

function currentParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = parts
    .find((part) => part.type === "weekday")
    ?.value.toLowerCase() as MenuWeekday;

  return {
    weekday,
    minutes:
      Number(parts.find((part) => part.type === "hour")?.value ?? "0") * 60 +
      Number(parts.find((part) => part.type === "minute")?.value ?? "0"),
  };
}

function isWithinWindow(minutes: number, opensAt: string, closesAt: string) {
  const opens = parseTimeToMinutes(opensAt);
  const closes = parseTimeToMinutes(closesAt);

  if (opens <= closes) {
    return minutes >= opens && minutes < closes;
  }

  return minutes >= opens || minutes < closes;
}

function findWeekday(weekday: MenuWeekday) {
  return MENU_WEEKDAYS.find((entry) => entry.value === weekday);
}

function sortStoreBusinessHours<T extends { weekday: string }>(hours: T[]) {
  const order = new Map<string, number>(
    MENU_WEEKDAYS.map((weekday, index) => [weekday.value, index]),
  );

  return [...hours].sort(
    (a, b) => (order.get(a.weekday) ?? 99) - (order.get(b.weekday) ?? 99),
  );
}

function buildStoreStatusFromHours(hours: StoreBusinessHour[], date = new Date()): StoreStatus {
  const { weekday, minutes } = currentParts(date);
  const today = hours.find((hour) => hour.weekday === weekday);
  const isOpen = Boolean(
    today?.isOpen && isWithinWindow(minutes, today.opensAt, today.closesAt),
  );

  return {
    isOpen,
    currentWeekday: weekday,
    hoursLabel: buildStoreHoursLabel(hours),
    currentWindow: today
      ? {
          weekday: today.weekday,
          label: today.label,
          opensAt: today.opensAt,
          closesAt: today.closesAt,
          isOpen: today.isOpen,
        }
      : null,
  };
}

export function serializeStoreProfileSummary(
  store: StoreProfileRecord,
): StoreProfileSummary {
  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    zipCode: store.zipCode,
    street: store.street,
    number: store.number,
    neighborhood: store.neighborhood,
    city: store.city,
    state: store.state,
    latitude: numberFromDecimal(store.latitude),
    longitude: numberFromDecimal(store.longitude),
    maxDeliveryDistanceKm: coerceNumber(store.maxDeliveryDistanceKm, 5),
  };
}

export function serializeStoreBusinessHours(
  hours: StoreBusinessHourRecord[],
): StoreBusinessHour[] {
  return sortStoreBusinessHours(hours).map((hour) => {
    const weekday = hour.weekday as MenuWeekday;
    const weekdayInfo = findWeekday(weekday);

    return {
      id: hour.id,
      weekday,
      label: weekdayInfo?.label || hour.weekday,
      short: weekdayInfo?.short || hour.weekday,
      opensAt: hour.opensAt,
      closesAt: hour.closesAt,
      isOpen: hour.isOpen,
    };
  });
}

export function serializeStoreDeliveryRule(
  rule: StoreDeliveryRuleRecord,
): DeliveryRule {
  return {
    ...rule,
    maxDistanceKm: coerceNumber(rule.maxDistanceKm),
    feeAmount: coerceNumber(rule.feeAmount),
    minimumOrderAmount: coerceNullableNumber(rule.minimumOrderAmount),
    freeAboveAmount: coerceNullableNumber(rule.freeAboveAmount),
  };
}

export function buildStoreHoursLabel(hours: StoreBusinessHour[]) {
  const openHours = hours.filter((hour) => hour.isOpen);
  if (!openHours.length) {
    return "Fechado todos os dias";
  }

  const first = openHours[0];
  const sameWindow = openHours.every(
    (hour) => hour.opensAt === first.opensAt && hour.closesAt === first.closesAt,
  );
  const allWeek = openHours.length === MENU_WEEKDAYS.length;

  if (sameWindow && allWeek) {
    return `Seg a Dom, das ${formatTime(first.opensAt)} as ${formatTime(first.closesAt)}`;
  }

  if (sameWindow) {
    return `${openHours.map((hour) => hour.short).join(", ")}, das ${formatTime(
      first.opensAt,
    )} as ${formatTime(first.closesAt)}`;
  }

  return openHours
    .map((hour) => `${hour.short} ${formatTime(hour.opensAt)}-${formatTime(hour.closesAt)}`)
    .join(" · ");
}

export function serializeStoreStatus(rawHours: StoreBusinessHourRecord[], date = new Date()) {
  return buildStoreStatusFromHours(serializeStoreBusinessHours(rawHours), date);
}

export function serializeStoreSettings(payload: {
  store: StoreProfileRecord;
  businessHours: StoreBusinessHourRecord[];
  deliveryRules: StoreDeliveryRuleRecord[];
}) : StoreSettings {
  const businessHours = serializeStoreBusinessHours(payload.businessHours);

  return {
    store: {
      name: payload.store.name,
      zipCode: payload.store.zipCode,
      street: payload.store.street,
      number: payload.store.number,
      neighborhood: payload.store.neighborhood,
      city: payload.store.city,
      state: payload.store.state,
      maxDeliveryDistanceKm: coerceNumber(payload.store.maxDeliveryDistanceKm, 5),
    },
    businessHours,
    deliveryRules: payload.deliveryRules.map(serializeStoreDeliveryRule),
    status: buildStoreStatusFromHours(businessHours),
  };
}
