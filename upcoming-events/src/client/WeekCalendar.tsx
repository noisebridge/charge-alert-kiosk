import type { MeetupEvent } from "../types";

const HOURS_START = 11; // 11 AM
const HOURS_END = 23; // 11 PM
const TOTAL_HOURS = HOURS_END - HOURS_START;

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

function getNext7Days(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function formatDayHeader(date: Date): { day: string; date: string } {
  return {
    day: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
          <div className="relative" style={{ height: `${TOTAL_HOURS * 28}px` }}>
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
        {days.map((day) => {
          const header = formatDayHeader(day);
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.dateTime), day)
          );

          return (
            <div key={day.toISOString()} className="flex-1 border-l border-gray-300">
              {/* Day header */}
              <div
                className={`h-10 flex flex-col items-center justify-center text-sm ${
                  isToday ? "text-black font-bold" : "text-gray-700"
                }`}
              >
                <span className="font-semibold">{header.day}</span>
                <span className="text-xs">{header.date}</span>
              </div>

              {/* Time grid */}
              <div
                className="relative"
                style={{ height: `${TOTAL_HOURS * 28}px` }}
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
                  const start = new Date(event.dateTime);
                  const end = new Date(event.endTime);
                  const startHour =
                    start.getHours() + start.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;

                  const topPct =
                    ((startHour - HOURS_START) / TOTAL_HOURS) * 100;
                  const heightPct =
                    ((endHour - startHour) / TOTAL_HOURS) * 100;

                  if (topPct < 0 || topPct > 100) return null;

                  // Check if this event overlaps with any earlier event in the same day
                  let overlapIndex = 0;
                  for (let j = 0; j < idx; j++) {
                    const other = dayEvents[j]!;
                    const otherStart = new Date(other.dateTime);
                    const otherEnd = new Date(other.endTime);
                    if (start < otherEnd && end > otherStart) {
                      overlapIndex++;
                      break;
                    }
                  }
                  const hasOverlap = overlapIndex > 0 || dayEvents.some((other, j) =>
                    j > idx &&
                    start < new Date(other.endTime) &&
                    end > new Date(other.dateTime)
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
