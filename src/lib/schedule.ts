// Regras de horário da barbearia. O banco valida as mesmas regras ao salvar.
export const SHOP_TIMEZONE = "America/Sao_Paulo";
export const SHOP_UTC_OFFSET = "-03:00";
/** Dias de atendimento (0 = domingo): terça a sábado. */
export const OPEN_WEEKDAYS = [2, 3, 4, 5, 6];
export const OPEN_MINUTE = 9 * 60;
export const CLOSE_MINUTE = 19 * 60;
export const SLOT_STEP = 30;

export type BusySlot = { barber_id: string; starts_at: string; ends_at: string };
export type Slot = { time: string; startsAt: string; endsAt: string; available: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

export function minutesToTime(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/** "YYYY-MM-DD" + "HH:MM" no horário da barbearia → ISO com fuso. */
export function toStartsAt(date: string, time: string) {
  return `${date}T${time}:00${SHOP_UTC_OFFSET}`;
}

export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export function isOpenDay(date: string) {
  return OPEN_WEEKDAYS.includes(weekdayOf(date));
}

/** Data de hoje no fuso da barbearia, em "YYYY-MM-DD". */
export function shopToday(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIMEZONE }).format(now);
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function upcomingDays(count: number, now: Date = new Date()) {
  const today = shopToday(now);
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

export function buildSlots({
  date,
  durationMin,
  barberId,
  busy,
  now = new Date(),
}: {
  date: string;
  durationMin: number;
  barberId: string;
  busy: BusySlot[];
  now?: Date;
}): Slot[] {
  if (!isOpenDay(date)) return [];
  const slots: Slot[] = [];
  for (let m = OPEN_MINUTE; m + durationMin <= CLOSE_MINUTE; m += SLOT_STEP) {
    const time = minutesToTime(m);
    const start = new Date(toStartsAt(date, time));
    const end = new Date(start.getTime() + durationMin * 60_000);
    const taken = busy.some(
      (b) =>
        b.barber_id === barberId &&
        new Date(b.starts_at).getTime() < end.getTime() &&
        new Date(b.ends_at).getTime() > start.getTime(),
    );
    slots.push({
      time,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      available: !taken && start.getTime() > now.getTime(),
    });
  }
  return slots;
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h${pad(r)}` : `${h}h`;
}

/** Rótulos para uma data "YYYY-MM-DD". */
export function dayLabels(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", ...o }).format(dt).replace(".", "");
  return {
    weekday: fmt({ weekday: "short" }),
    day: fmt({ day: "2-digit" }),
    month: fmt({ month: "short" }),
    long: fmt({ weekday: "long", day: "numeric", month: "long" }),
  };
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: SHOP_TIMEZONE, hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

export function formatDateLong(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SHOP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

/** Início e fim do dia no fuso da barbearia, para filtrar agendamentos. */
export function dayRange(date: string) {
  return { from: toStartsAt(date, "00:00"), to: toStartsAt(addDays(date, 1), "00:00") };
}
