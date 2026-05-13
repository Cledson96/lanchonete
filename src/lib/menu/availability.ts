export const MENU_WEEKDAYS = [
  { value: "sunday", label: "Domingo", short: "Dom" },
  { value: "monday", label: "Segunda-feira", short: "Seg" },
  { value: "tuesday", label: "Terça-feira", short: "Ter" },
  { value: "wednesday", label: "Quarta-feira", short: "Qua" },
  { value: "thursday", label: "Quinta-feira", short: "Qui" },
  { value: "friday", label: "Sexta-feira", short: "Sex" },
  { value: "saturday", label: "Sábado", short: "Sab" },
] as const;

export type MenuWeekday = (typeof MENU_WEEKDAYS)[number]["value"];

const WEEKDAY_LOOKUP = new Map(MENU_WEEKDAYS.map((weekday) => [weekday.value, weekday] as const));
const WEEKDAY_VALUES = MENU_WEEKDAYS.map((weekday) => weekday.value) as MenuWeekday[];

const TIME_ZONE = "America/Sao_Paulo";

export function getCurrentWeekday(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: TIME_ZONE,
  }).format(date).toLowerCase() as MenuWeekday;
}

export function normalizeMenuWeekdays(weekdays?: string[] | null) {
  return (weekdays || [])
    .map((weekday) => weekday.trim().toLowerCase())
    .filter((weekday): weekday is MenuWeekday => WEEKDAY_VALUES.includes(weekday as MenuWeekday));
}

export function isMenuItemAvailableNow(input: { availableWeekdays?: string[] | null }, date = new Date()) {
  const weekdays = normalizeMenuWeekdays(input.availableWeekdays);

  if (!weekdays.length) {
    return true;
  }

  return weekdays.includes(getCurrentWeekday(date));
}

export function formatMenuWeekdays(weekdays?: string[] | null) {
  const normalized = normalizeMenuWeekdays(weekdays);

  if (!normalized.length || normalized.length === MENU_WEEKDAYS.length) {
    return "todos os dias";
  }

  return normalized.map((weekday) => WEEKDAY_LOOKUP.get(weekday)?.short || weekday).join(", ");
}
