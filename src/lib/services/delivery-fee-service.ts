import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { geocodeBrazilianAddress, haversineDistanceInKm } from "@/lib/geocoding";
import { decimal, numberFromDecimal } from "@/lib/utils";

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

async function getMainStoreProfile() {
  const storeDelegate = (
    prisma as typeof prisma & {
      storeProfile?: {
        findUnique: typeof prisma.deliveryFeeRule.findUnique;
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

  const store = await storeDelegate.findUnique({
    where: { slug: "loja-principal" },
  });

  if (!store) {
    throw new ApiError(500, "Loja principal nao configurada para calculo de entrega.");
  }

  return store;
}

async function resolveStoreCoordinates() {
  const store = await getMainStoreProfile();
  const latitude = numberFromDecimal(store.latitude);
  const longitude = numberFromDecimal(store.longitude);

  if (latitude !== null && longitude !== null) {
    return {
      store,
      latitude,
      longitude,
    };
  }

  const geocoded = await geocodeBrazilianAddress({
    street: store.street,
    number: store.number,
    neighborhood: store.neighborhood,
    city: store.city,
    state: store.state,
    zipCode: store.zipCode,
  });

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

  const customerCoordinates = await geocodeBrazilianAddress({
    street: input.street,
    number: input.number,
    neighborhood: input.neighborhood,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
  });

  const distanceKm = haversineDistanceInKm(
    { latitude, longitude },
    {
      latitude: customerCoordinates.latitude,
      longitude: customerCoordinates.longitude,
    },
  );

  const maxDeliveryDistanceKm = numberFromDecimal(store.maxDeliveryDistanceKm) ?? 5;

  if (distanceKm > maxDeliveryDistanceKm) {
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
    return maxDistanceRuleKm !== null && distanceKm <= maxDistanceRuleKm;
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
    distanceKm: Number(distanceKm.toFixed(2)),
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
      city: store.city,
      state: store.state,
      maxDeliveryDistanceKm,
    },
  };
}

export async function getDeliveryFeeRules() {
  return prisma.deliveryFeeRule.findMany({
    orderBy: [{ maxDistanceKm: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });
}
