export type CategoryAvailabilityWindow = {
  availableFrom?: string | null;
  availableUntil?: string | null;
};

const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

function parseTimeToMinutes(value?: string | null) {
  if (!value) {
    return null;
  }

  const [hourPart, minutePart] = value.split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function getCurrentMinutes(timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

export function isWithinAvailabilityWindow(
  currentMinutes: number,
  window: CategoryAvailabilityWindow,
) {
  const from = parseTimeToMinutes(window.availableFrom);
  const until = parseTimeToMinutes(window.availableUntil);

  if (from == null && until == null) {
    return true;
  }

  if (from != null && until != null) {
    if (from <= until) {
      return currentMinutes >= from && currentMinutes < until;
    }

    return currentMinutes >= from || currentMinutes < until;
  }

  if (from != null) {
    return currentMinutes >= from;
  }

  return until == null || currentMinutes < until;
}

export function isCategoryAvailableNow(
  window: CategoryAvailabilityWindow,
  timeZone = DEFAULT_TIME_ZONE,
) {
  return isWithinAvailabilityWindow(getCurrentMinutes(timeZone), window);
}

export function formatAvailabilityWindow(window: CategoryAvailabilityWindow) {
  const from = window.availableFrom?.trim();
  const until = window.availableUntil?.trim();

  if (from && until) {
    return `${from} às ${until}`;
  }

  if (from) {
    return `a partir de ${from}`;
  }

  if (until) {
    return `até ${until}`;
  }

  return "o dia todo";
}
