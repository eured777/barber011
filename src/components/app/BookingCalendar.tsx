import { ptBR } from "date-fns/locale";

import { Calendar } from "@/components/ui/calendar";
import { isOpenDay } from "@/lib/schedule";

const toDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};
const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Calendário mensal: só libera dias de atendimento entre hoje e o último dia permitido.
export function BookingCalendar({
  value,
  onChange,
  minDate,
  maxDate,
}: {
  value: string;
  onChange: (d: string) => void;
  minDate: string;
  maxDate: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-2 shadow-card">
      <Calendar
        mode="single"
        locale={ptBR}
        required
        selected={toDate(value)}
        defaultMonth={toDate(value)}
        onSelect={(d) => d && onChange(toKey(d))}
        startMonth={toDate(minDate)}
        endMonth={toDate(maxDate)}
        disabled={(d) => {
          const k = toKey(d);
          return k < minDate || k > maxDate || !isOpenDay(k);
        }}
        showOutsideDays={false}
        className="w-full bg-transparent p-1 [--cell-size:2.75rem] [&_[data-selected-single=true]]:bg-gradient-gold [&_[data-selected-single=true]]:font-bold [&_[data-selected-single=true]]:text-primary-foreground [&_[data-selected-single=true]]:shadow-gold"
        classNames={{
          root: "w-full",
          caption_label: "font-display text-2xl capitalize tracking-wide text-foreground",
          weekday: "flex-1 select-none text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground",
          today: "rounded-full text-primary [&_button]:font-bold",
          disabled: "text-muted-foreground opacity-30",
          day: "group/day relative aspect-square h-full w-full select-none p-0.5 text-center [&_button]:rounded-full",
          button_previous: "inline-flex size-10 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 aria-disabled:opacity-30",
          button_next: "inline-flex size-10 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 aria-disabled:opacity-30",
        }}
      />
      <p className="px-3 pb-2 text-center text-xs text-muted-foreground">Atendemos de terça a sábado</p>
    </div>
  );
}
