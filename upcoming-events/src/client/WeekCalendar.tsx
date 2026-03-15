import type { MeetupEvent } from "../types";

const TZ = "America/Los_Angeles";
const HOURS_START = 11; // 11 AM
const HOURS_END = 23; // 11 PM
const TOTAL_HOURS = HOURS_END - HOURS_START;

/** Get the Pacific-time date parts for a Date object */
function dateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

const EVENT_COLORS = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-lime-500",
  "bg-orange-500",
];

/** Returns 7 dates representing the next 7 Pacific-time calendar days (as YYYY-MM-DD strings for comparison) */
function getNext7Days(): { key: string; label: { day: string; date: string } }[] {
  const now = new Date();
  const days: { key: string; label: { day: string; date: string } }[] = [];
  for (let i = 0; i < 7; i++) {
    // Create a date at noon Pacific for the target day to avoid DST issues
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const p = dateParts(d);
    const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
    days.push({
      key,
      label: {
        day: d.toLocaleDateString("en-US", { weekday: "short", timeZone: TZ }),
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ }),
      },
    });
  }
  return days;
}

function pacificDateKey(date: Date): string {
  const p = dateParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

// Assign a consistent color to each unique event title
function getColorForTitle(title: string, colorMap: Map<string, string>): string {
  if (!colorMap.has(title)) {
    colorMap.set(title, EVENT_COLORS[colorMap.size % EVENT_COLORS.length]!);
  }
  return colorMap.get(title)!;
}

export function WeekCalendar({ events }: { events: MeetupEvent[] }) {
  const days = getNext7Days();
  const colorMap = new Map<string, string>();

  // Pre-assign colors to all unique titles
  events.forEach((e) => getColorForTitle(e.title, colorMap));

  return (
    <div className="bg-transparent border-t border-gray-300">
      <div className="flex">
        {/* Time gutter */}
        <div className="w-12 flex-0">
          <div className="h-10" /> {/* header spacer */}
          <div className="relative" style={{ height: `${TOTAL_HOURS * 34}px` }}>
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute text-[11px] text-gray-400 -translate-y-1/2"
                style={{ top: `${(i / TOTAL_HOURS) * 100}%`, right: 4 }}
              >
                {((HOURS_START + i) % 12 || 12) +
                  (HOURS_START + i >= 12 ? "p" : "a")}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        {days.map((day, dayIdx) => {
          const isToday = dayIdx === 0;
          const dayEvents = events.filter((e) =>
            pacificDateKey(new Date(e.dateTime)) === day.key
          );

          return (
            <div key={day.key} className="flex-1 border-l border-gray-300">
              {/* Day header */}
              <div
                className={`h-10 flex flex-col items-center justify-center text-sm ${
                  isToday ? "text-black font-bold" : "text-gray-700"
                }`}
              >
                <span className="font-semibold">{day.label.day}</span>
                <span className="text-xs">{day.label.date}</span>
              </div>

              {/* Time grid */}
              <div
                className="relative"
                style={{ height: `${TOTAL_HOURS * 34}px` }}
              >
                {/* Hour lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-gray-300"
                    style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
                  />
                ))}

                {/* Event bars */}
                {dayEvents.map((event, idx) => {
                  const startParts = dateParts(new Date(event.dateTime));
                  const endParts = dateParts(new Date(event.endTime));
                  const startHour = startParts.hour + startParts.minute / 60;
                  const endHour = endParts.hour + endParts.minute / 60;

                  const topPct =
                    ((startHour - HOURS_START) / TOTAL_HOURS) * 100;
                  const heightPct =
                    ((endHour - startHour) / TOTAL_HOURS) * 100;

                  if (topPct < 0 || topPct > 100) return null;

                  // Check if this event overlaps with any earlier event in the same day
                  const evStart = new Date(event.dateTime);
                  const evEnd = new Date(event.endTime);
                  let overlapIndex = 0;
                  for (let j = 0; j < idx; j++) {
                    const other = dayEvents[j]!;
                    const otherStart = new Date(other.dateTime);
                    const otherEnd = new Date(other.endTime);
                    if (evStart < otherEnd && evEnd > otherStart) {
                      overlapIndex++;
                      break;
                    }
                  }
                  const hasOverlap = overlapIndex > 0 || dayEvents.some((other, j) =>
                    j > idx &&
                    evStart < new Date(other.endTime) &&
                    evEnd > new Date(other.dateTime)
                  );

                  const color = getColorForTitle(event.title, colorMap);

                  return (
                    <div
                      key={event.id}
                      className={`absolute rounded-sm ${color} overflow-hidden px-2 py-1.5`}
                      style={{
                        top: `${topPct}%`,
                        height: `${Math.max(heightPct, 2)}%`,
                        left: hasOverlap ? (overlapIndex > 0 ? "50%" : "2px") : "2px",
                        right: hasOverlap ? (overlapIndex > 0 ? "2px" : "50%") : "2px",
                      }}
                    >
                      <span className="text-[11px] text-white font-semibold leading-tight block truncate">
                        {event.title}
                      </span>
                      <span className="text-[10px] text-white/80 leading-tight block truncate">
                        {new Date(event.dateTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: TZ,
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
