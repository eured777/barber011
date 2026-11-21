import { dayLabels, isOpenDay } from "@/lib/schedule";
import { cn } from "@/lib/utils";

import { chipClass } from "./ui-classes";

export function DayPicker({
  days,
  value,
  onChange,
  allowClosed = false,
}: {
  days: string[];
  value: string;
  onChange: (d: string) => void;
  allowClosed?: boolean;
}) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {days.map((d) => {
        const l = dayLabels(d);
        const closed = !isOpenDay(d);
        const disabled = closed && !allowClosed;
        return (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => onChange(d)}
            className={cn(
              "flex w-16 shrink-0 flex-col items-center py-2.5 transition-all",
              chipClass(value === d),
              disabled && "cursor-not-allowed opacity-35 hover:border-border",
            )}
          >
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider opacity-80">{l.weekday}</span>
            <span className="font-display text-2xl leading-tight">{l.day}</span>
            <span className="text-[0.65rem] uppercase opacity-70">{closed ? "fechado" : l.month}</span>
          </button>
        );
      })}
    </div>
  );
}
