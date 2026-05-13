import { ApiError } from "@/lib/api/error";
import type {
  StoreBusinessHour,
  StoreSettings,
  StoreStatus,
} from "@/lib/contracts/store";
import { MENU_WEEKDAYS } from "@/lib/menu/availability";
import { prisma } from "@/lib/prisma";
import {
  buildStoreHoursLabel,
  serializeStoreSettings,
  serializeStoreStatus,
} from "@/lib/store-serializers";
import { decimal } from "@/lib/db/decimal";
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

  return serializeStoreSettings({
    store,
    businessHours: hours,
    deliveryRules: rules,
  });
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
  return buildStoreHoursLabel(hours);
}

export function buildStoreStatus(rawHours: Array<{
  id: string;
  weekday: string;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
}>): StoreStatus {
  return serializeStoreStatus(rawHours);
}

export async function getPublicStoreStatus(): Promise<StoreStatus> {
  const store = await getMainStoreProfile();
  await ensureDefaultBusinessHours(store.id);
  const hours = await prisma.storeBusinessHour.findMany({
    where: { storeProfileId: store.id },
  });

  return serializeStoreStatus(hours);
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
