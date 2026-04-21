import { ApiError } from "@/lib/http";
import { SimpleCache } from "@/lib/simple-cache";

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
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "User-Agent": "lanchonete-familia/1.0 (checkout-distance-delivery)",
      },
      cache: "force-cache",
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

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
