import { ApiError } from "@/lib/api/error";
import { SimpleCache } from "@/lib/simple-cache";
import { config } from "@/lib/config";

type GeocodeInput = {
  street: string;
  number: string;
  neighborhood?: string | null;
  city: string;
  state: string;
  zipCode?: string | null;
};

type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

const geocodeCache = new SimpleCache<GeocodeResult>(60 * 60 * 1000);
const routeDistanceCache = new SimpleCache<number>(30 * 60 * 1000);

function buildCacheKey(input: GeocodeInput) {
  return [
    input.street.trim().toLowerCase(),
    input.number.trim().toLowerCase(),
    (input.neighborhood || "").trim().toLowerCase(),
    input.city.trim().toLowerCase(),
    input.state.trim().toLowerCase(),
    (input.zipCode || "").replace(/\D/g, ""),
  ].join("|");
}

function buildQuery(input: GeocodeInput) {
  return [
    `${input.street.trim()}, ${input.number.trim()}`,
    input.neighborhood?.trim(),
    input.city.trim(),
    input.state.trim(),
    input.zipCode?.trim(),
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
}

function buildQueryVariants(input: GeocodeInput) {
  const base = {
    street: input.street.trim(),
    number: input.number.trim(),
    neighborhood: input.neighborhood?.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zipCode: input.zipCode?.trim(),
  };

  return [
    buildQuery(base),
    buildQuery({ ...base, zipCode: undefined }),
    buildQuery({ ...base, neighborhood: undefined }),
    buildQuery({ ...base, neighborhood: undefined, zipCode: undefined }),
  ].filter(Boolean);
}

function buildRouteCacheKey(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  return [
    origin.latitude.toFixed(6),
    origin.longitude.toFixed(6),
    destination.latitude.toFixed(6),
    destination.longitude.toFixed(6),
  ].join("|");
}

export async function geocodeBrazilianAddress(
  input: GeocodeInput,
): Promise<GeocodeResult> {
  const cacheKey = buildCacheKey(input);
  const cached = geocodeCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  for (const query of buildQueryVariants(input)) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("addressdetails", "1");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          "User-Agent": "lanchonete-familia/1.0 (checkout-distance-delivery)",
        },
        cache: "force-cache",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new ApiError(502, "Nao foi possivel consultar o servico de geolocalizacao.");
    }

    const payload = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    const first = payload[0];

    if (!first) {
      continue;
    }

    const result = {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name,
    };

    geocodeCache.set(cacheKey, result);
    return result;
  }

  throw new ApiError(422, "Nao foi possivel localizar esse endereco para calcular o frete.");
}

export async function drivingDistanceInKm(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const cacheKey = buildRouteCacheKey(origin, destination);
  const cached = routeDistanceCache.get(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const url = new URL(
    `/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`,
    config.routingServiceUrl,
  );
  url.searchParams.set("overview", "false");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ApiError(502, "Nao foi possivel consultar a rota para calcular a entrega.");
  }

  const payload = (await response.json()) as {
    code?: string;
    routes?: Array<{
      distance?: number;
    }>;
  };

  if (payload.code !== "Ok") {
    throw new ApiError(422, "Nao encontramos rota viaria para esse endereco.");
  }

  const distanceMeters = payload.routes?.[0]?.distance;

  if (typeof distanceMeters !== "number" || !Number.isFinite(distanceMeters)) {
    throw new ApiError(422, "Nao foi possivel medir a distancia da rota para esse endereco.");
  }

  const distanceKm = distanceMeters / 1000;
  routeDistanceCache.set(cacheKey, distanceKm);
  routeDistanceCache.set(buildRouteCacheKey(destination, origin), distanceKm);

  return distanceKm;
}

export function haversineDistanceInKm(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLon = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
