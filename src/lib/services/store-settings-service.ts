import { ApiError } from "@/lib/http";
import type {
  DeliveryRule,
  StoreBusinessHour,
  StoreProfileSummary,
  StoreSettings,
  StoreStatus,
} from "@/lib/contracts/store";
import { MENU_WEEKDAYS, type MenuWeekday } from "@/lib/menu-item-availability";
import { prisma } from "@/lib/prisma";
import { decimal, numberFromDecimal } from "@/lib/utils";

const TIME_ZONE = "America/Sao_Paulo";
const STORE_SLUG = "loja-principal";

type StoreHoursInput = {
  weekday: string;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
};

type StoreProfileInput = {
  name: string;
  zipCode?: string;
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  maxDeliveryDistanceKm: number;
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
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return {
    weekday,
    minutes: hour * 60 + minute,
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

function serializeStore(
  store: Awaited<ReturnType<typeof getMainStoreProfile>>,
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
    maxDeliveryDistanceKm: numberFromDecimal(store.maxDeliveryDistanceKm) ?? 5,
  };
}

function sortHours<T extends { weekday: string }>(hours: T[]) {
  const order = new Map<string, number>(
    MENU_WEEKDAYS.map((weekday, index) => [weekday.value, index]),
  );
  return [...hours].sort(
    (a, b) => (order.get(a.weekday) ?? 99) - (order.get(b.weekday) ?? 99),
  );
}

function serializeHours(hours: Array<{
  id: string;
  weekday: string;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
}>): StoreBusinessHour[] {
  return sortHours(hours).map((hour) => ({
    id: hour.id,
    weekday: hour.weekday as MenuWeekday,
    label: MENU_WEEKDAYS.find((weekday) => weekday.value === (hour.weekday as MenuWeekday))?.label || hour.weekday,
    short: MENU_WEEKDAYS.find((weekday) => weekday.value === (hour.weekday as MenuWeekday))?.short || hour.weekday,
    opensAt: hour.opensAt,
    closesAt: hour.closesAt,
    isOpen: hour.isOpen,
  }));
}

function serializeDeliveryRule(rule: {
  id: string;
  label: string;
  neighborhood: string | null;
  city: string;
  state: string;
  zipCodeStart: string | null;
  zipCodeEnd: string | null;
  maxDistanceKm: unknown;
  feeAmount: unknown;
  minimumOrderAmount: unknown;
  freeAboveAmount: unknown;
  estimatedMinMinutes: number | null;
  estimatedMaxMinutes: number | null;
  sortOrder: number;
  isActive: boolean;
}): DeliveryRule {
  return {
    ...rule,
    maxDistanceKm: Number(rule.maxDistanceKm),
    feeAmount: Number(rule.feeAmount),
    minimumOrderAmount:
      rule.minimumOrderAmount == null ? null : Number(rule.minimumOrderAmount),
    freeAboveAmount: rule.freeAboveAmount == null ? null : Number(rule.freeAboveAmount),
  };
}

export async function getMainStoreProfile() {
  const store = await prisma.storeProfile.findUnique({
    where: { slug: STORE_SLUG },
  });

  if (!store) {
    throw new ApiError(500, "Loja principal nao configurada.");
  }

  return store;
}

export async function ensureDefaultBusinessHours(storeProfileId: string) {
  await Promise.all(
    MENU_WEEKDAYS.map((weekday) =>
      prisma.storeBusinessHour.upsert({
        where: {
          storeProfileId_weekday: {
            storeProfileId,
            weekday: weekday.value,
          },
        },
        create: {
          storeProfileId,
          weekday: weekday.value,
          opensAt: "18:00",
          closesAt: "23:30",
          isOpen: true,
        },
        update: {},
      }),
    ),
  );
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const store = await getMainStoreProfile();
  await ensureDefaultBusinessHours(store.id);

  const [hours, rules] = await Promise.all([
    prisma.storeBusinessHour.findMany({
      where: { storeProfileId: store.id },
    }),
    prisma.deliveryFeeRule.findMany({
      orderBy: [{ maxDistanceKm: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    }),
  ]);

  return {
    store: serializeStore(store),
    businessHours: serializeHours(hours),
    deliveryRules: rules.map(serializeDeliveryRule),
    status: buildStoreStatus(hours),
  };
}

export async function updateStoreSettings(input: {
  store: StoreProfileInput;
  businessHours: StoreHoursInput[];
}) {
  const store = await getMainStoreProfile();
  const addressChanged =
    store.zipCode !== (input.store.zipCode || null) ||
    store.street !== input.store.street ||
    store.number !== input.store.number ||
    store.neighborhood !== (input.store.neighborhood || null) ||
    store.city !== input.store.city ||
    store.state !== input.store.state;

  await prisma.$transaction(async (tx) => {
    await tx.storeProfile.update({
      where: { id: store.id },
      data: {
        name: input.store.name,
        zipCode: input.store.zipCode || null,
        street: input.store.street,
        number: input.store.number,
        neighborhood: input.store.neighborhood || null,
        city: input.store.city,
        state: input.store.state.toUpperCase(),
        maxDeliveryDistanceKm: decimal(input.store.maxDeliveryDistanceKm),
        latitude: addressChanged ? null : undefined,
        longitude: addressChanged ? null : undefined,
      },
    });

    for (const hour of input.businessHours) {
      await tx.storeBusinessHour.upsert({
        where: {
          storeProfileId_weekday: {
            storeProfileId: store.id,
            weekday: hour.weekday,
          },
        },
        create: {
          storeProfileId: store.id,
          weekday: hour.weekday,
          opensAt: hour.opensAt,
          closesAt: hour.closesAt,
          isOpen: hour.isOpen,
        },
        update: {
          opensAt: hour.opensAt,
          closesAt: hour.closesAt,
          isOpen: hour.isOpen,
        },
      });
    }
  });

  return getStoreSettings();
}

export function buildHoursLabel(hours: StoreBusinessHour[]) {
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

export function buildStoreStatus(rawHours: Array<{
  id: string;
  weekday: string;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
}>): StoreStatus {
  const hours = serializeHours(rawHours);
  const { weekday, minutes } = currentParts();
  const today = hours.find((hour) => hour.weekday === weekday);
  const isOpen = Boolean(
    today?.isOpen && isWithinWindow(minutes, today.opensAt, today.closesAt),
  );

  return {
    isOpen,
    currentWeekday: weekday,
    hoursLabel: buildHoursLabel(hours),
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

export async function getPublicStoreStatus(): Promise<StoreStatus> {
  const store = await getMainStoreProfile();
  await ensureDefaultBusinessHours(store.id);
  const hours = await prisma.storeBusinessHour.findMany({
    where: { storeProfileId: store.id },
  });

  return buildStoreStatus(hours);
}

export async function assertStoreIsOpenForOrders() {
  const status = await getPublicStoreStatus();

  if (!status.isOpen) {
    throw new ApiError(
      422,
      `A loja esta fechada agora. Horario de atendimento: ${status.hoursLabel}.`,
    );
  }
}
