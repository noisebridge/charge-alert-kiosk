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
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#14b8a6", // teal-500
  "#6366f1", // indigo-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
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
    <div className="week-calendar">
      <div className="week-calendar-grid">
        {/* Time gutter */}
        <div className="time-gutter">
          <div className="time-gutter-spacer" /> {/* header spacer */}
          <div className="time-gutter-body" style={{ height: `${TOTAL_HOURS * 34}px` }}>
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
              <div
                key={i}
                className="time-label"
                style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
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
            <div key={day.key} className="day-column">
              {/* Day header */}
              <div
                className={`day-header ${isToday ? "day-header-today" : ""}`}
              >
                <span className="day-name">{day.label.day}</span>
                <span className="day-date">{day.label.date}</span>
              </div>

              {/* Time grid */}
              <div
                className="day-grid"
                style={{ height: `${TOTAL_HOURS * 34}px` }}
              >
                {/* Hour lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="hour-line"
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
                      className="event-bar"
                      style={{
                        top: `${topPct}%`,
                        height: `${Math.max(heightPct, 2)}%`,
                        left: hasOverlap ? (overlapIndex > 0 ? "50%" : "2px") : "2px",
                        right: hasOverlap ? (overlapIndex > 0 ? "2px" : "50%") : "2px",
                        backgroundColor: color,
                      }}
                    >
                      <span className="event-bar-title">
                        {event.title}
                      </span>
                      <span className="event-bar-time">
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
