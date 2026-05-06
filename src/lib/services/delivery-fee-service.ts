import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  drivingDistanceInKm,
  geocodeBrazilianAddress,
  haversineDistanceInKm,
} from "@/lib/geocoding";
import { config } from "@/lib/config";
import { decimal, numberFromDecimal } from "@/lib/utils";
import { getMainStoreProfile } from "@/lib/services/store-settings-service";

type DeliveryQuoteInput = {
  street: string;
  number: string;
  zipCode?: string;
  neighborhood: string;
  city: string;
  state: string;
  subtotalAmount?: number;
};

function normalize(text?: string | null) {
  return (text || "").trim().toLowerCase();
}

function normalizeStreet(text?: string | null) {
  return normalize(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(rua|r\.|avenida|av\.|travessa|tv\.)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSameStoreAddress(
  store: {
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode?: string | null;
  },
  input: DeliveryQuoteInput,
) {
  return (
    normalizeStreet(store.street) === normalizeStreet(input.street) &&
    normalize(store.number) === normalize(input.number) &&
    normalize(store.city) === normalize(input.city) &&
    normalize(store.state) === normalize(input.state) &&
    normalize((store.zipCode || "").replace(/\D/g, "")) ===
      normalize((input.zipCode || "").replace(/\D/g, ""))
  );
}

function isNearSamePoint(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  return haversineDistanceInKm(origin, destination) <= 0.2;
}

function applyRoutingSafetyFactor(distanceKm: number) {
  return distanceKm * config.routingDistanceSafetyFactor;
}

const STORE_COORDINATE_MAX_DRIFT_KM = 0.5;

async function resolveStoreCoordinates() {
  const store = await getMainStoreProfile();
  const geocoded = await geocodeBrazilianAddress({
    street: store.street,
    number: store.number,
    neighborhood: store.neighborhood,
    city: store.city,
    state: store.state,
    zipCode: store.zipCode,
  });

  const savedLatitude = numberFromDecimal(store.latitude);
  const savedLongitude = numberFromDecimal(store.longitude);

  if (savedLatitude !== null && savedLongitude !== null) {
    const savedCoordinates = {
      latitude: savedLatitude,
      longitude: savedLongitude,
    };
    const geocodedCoordinates = {
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    };

    if (
      haversineDistanceInKm(savedCoordinates, geocodedCoordinates) <=
      STORE_COORDINATE_MAX_DRIFT_KM
    ) {
      return {
        store,
        latitude: savedLatitude,
        longitude: savedLongitude,
      };
    }
  }

  const storeDelegate = (
    prisma as typeof prisma & {
      storeProfile?: {
        update: typeof prisma.deliveryFeeRule.update;
      };
    }
  ).storeProfile;

  if (!storeDelegate) {
    throw new ApiError(
      500,
      "Configuracao de loja indisponivel no runtime. Rode npm run prisma:generate e reinicie o servidor.",
    );
  }

  await storeDelegate.update({
    where: { id: store.id },
    data: {
      latitude: decimal(geocoded.latitude),
      longitude: decimal(geocoded.longitude),
    },
  });

  return {
    store,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
  };
}

export async function resolveDeliveryFeeRule(input: DeliveryQuoteInput) {
  const { store, latitude, longitude } = await resolveStoreCoordinates();
  let distanceMethod: "same_address" | "route" = "same_address";

  const distanceKm = isSameStoreAddress(store, input)
    ? 0
    : await (async () => {
        const customerCoordinates = await geocodeBrazilianAddress({
          street: input.street,
          number: input.number,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
        });

        if (
          isNearSamePoint(
            { latitude, longitude },
            {
              latitude: customerCoordinates.latitude,
              longitude: customerCoordinates.longitude,
            },
          )
        ) {
          distanceMethod = "same_address";
          return 0;
        }

        try {
          distanceMethod = "route";
          return applyRoutingSafetyFactor(
            await drivingDistanceInKm(
              { latitude, longitude },
              {
                latitude: customerCoordinates.latitude,
                longitude: customerCoordinates.longitude,
              },
            ),
          );
        } catch (error) {
          throw new ApiError(
            502,
            error instanceof Error
              ? error.message
              : "Nao foi possivel consultar a rota para calcular a entrega.",
          );
        }
      })();

  const normalizedDistanceKm = Number(distanceKm.toFixed(2));
  const maxDeliveryDistanceKm = numberFromDecimal(store.maxDeliveryDistanceKm) ?? 5;

  if (normalizedDistanceKm > maxDeliveryDistanceKm) {
    throw new ApiError(
      422,
      `Area de entrega nao atendida. Entregamos ate ${maxDeliveryDistanceKm.toFixed(0)} km da loja.`,
    );
  }

  const rules = await prisma.deliveryFeeRule.findMany({
    where: {
      isActive: true,
      city: {
        equals: normalize(store.city),
        mode: "insensitive",
      },
      state: {
        equals: normalize(store.state),
        mode: "insensitive",
      },
    },
    orderBy: [{ maxDistanceKm: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });

  const matchedRule = rules.find((rule) => {
    const maxDistanceRuleKm = numberFromDecimal(rule.maxDistanceKm);
    return maxDistanceRuleKm !== null && normalizedDistanceKm <= maxDistanceRuleKm;
  });

  if (!matchedRule) {
    throw new ApiError(422, "Nao encontramos uma faixa de frete para essa distancia.");
  }

  const minimumOrderAmount = numberFromDecimal(matchedRule.minimumOrderAmount);
  const freeAboveAmount = numberFromDecimal(matchedRule.freeAboveAmount);

  if (
    typeof input.subtotalAmount === "number" &&
    minimumOrderAmount !== null &&
    input.subtotalAmount < minimumOrderAmount
  ) {
    throw new ApiError(
      422,
      `Pedido abaixo do minimo para entrega (${minimumOrderAmount.toFixed(2)}).`,
    );
  }

  const feeAmount =
    typeof input.subtotalAmount === "number" &&
    freeAboveAmount !== null &&
    input.subtotalAmount >= freeAboveAmount
      ? 0
      : Number(matchedRule.feeAmount);

  return {
    serviceable: true,
    deliveryFeeRuleId: matchedRule.id,
    feeAmount,
    estimatedMinMinutes: matchedRule.estimatedMinMinutes,
    estimatedMaxMinutes: matchedRule.estimatedMaxMinutes,
    distanceKm: normalizedDistanceKm,
    distanceMethod,
    rule: {
      id: matchedRule.id,
      label: matchedRule.label,
      city: matchedRule.city,
      state: matchedRule.state,
      neighborhood: matchedRule.neighborhood,
      zipCodeStart: matchedRule.zipCodeStart,
      zipCodeEnd: matchedRule.zipCodeEnd,
      feeAmount,
      maxDistanceKm: numberFromDecimal(matchedRule.maxDistanceKm),
      minimumOrderAmount,
      freeAboveAmount,
    },
    store: {
      name: store.name,
      street: store.street,
      number: store.number,
      city: store.city,
      state: store.state,
      zipCode: store.zipCode,
      maxDeliveryDistanceKm,
    },
  };
}

export async function getDeliveryFeeRules() {
  return prisma.deliveryFeeRule.findMany({
    orderBy: [{ maxDistanceKm: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });
}
