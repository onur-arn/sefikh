import { MONTHS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Calendrier de disponibilité de production (mois disponibles mis en évidence). */
export function AvailabilityCalendar({ months }: { months: number[] }) {
  const now = new Date().getMonth() + 1;
  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {MONTHS.map((m, i) => {
          const on = months.includes(i + 1);
          return (
            <div key={m} className="text-center">
              <div className={cn("h-9 rounded-md transition", on ? "bg-ink" : "bg-sand", i + 1 === now && "ring-2 ring-brass ring-offset-2 ring-offset-ivory")} title={`${m}: ${on ? "available" : "busy"}`} />
              <span className="mt-1.5 block text-[10px] text-muted">{m[0]}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-ink" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sand" /> Fully booked</span>
      </div>
    </div>
  );
}
