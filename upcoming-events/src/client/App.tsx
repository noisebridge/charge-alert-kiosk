import { useState, useEffect, useCallback, useMemo } from "react";
import type { MeetupEvent } from "../types";
import { EventHighlight } from "./EventHighlight";
import { WeekCalendar } from "./WeekCalendar";
import { CarouselPips } from "./CarouselPips";

const TZ = "America/Los_Angeles";
const ROTATE_INTERVAL = 15_000; // 15 seconds per event
const REFRESH_INTERVAL = 30 * 60_000; // 30 minutes

/** Milliseconds until the next midnight in Pacific time */
function msUntilMidnight(): number {
  const now = new Date();
  const pacific = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  const midnight = new Date(pacific);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return midnight.getTime() - pacific.getTime();
}

function pacificMidnightToday(): Date {
  // Get today's date in Pacific time
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const dateStr = formatter.format(new Date()); // "YYYY-MM-DD"
  // Parse as local, then adjust: find the UTC time when it's midnight in Pacific
  const local = new Date(`${dateStr}T00:00:00`);
  const inPacific = new Date(local.toLocaleString("en-US", { timeZone: TZ }));
  return new Date(local.getTime() + (local.getTime() - inPacific.getTime()));
}

function getWeekEvents(events: MeetupEvent[]): MeetupEvent[] {
  const start = pacificMidnightToday();
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  return events.filter((e) => {
    const d = new Date(e.dateTime);
    return d >= start && d <= end;
  });
}

export function App() {
  const [events, setEvents] = useState<MeetupEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data: unknown = await res.json();
      if (!res.ok && typeof data === "object" && data !== null && "error" in data) {
        setError(String((data as { error: unknown }).error));
        return;
      }
      setError(null);
      setEvents(data as MeetupEvent[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch events");
    }
  }, []);

  const weekEvents = useMemo(() => getWeekEvents(events), [events]);

  // Fetch events on mount and every 30 minutes
  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEvents]);

  // Refresh at Pacific midnight, then schedule the next midnight
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timeout = setTimeout(() => {
        fetchEvents();
        scheduleNext();
      }, msUntilMidnight());
    };
    scheduleNext();
    return () => clearTimeout(timeout);
  }, [fetchEvents]);

  // Rotate through events every 15 seconds
  useEffect(() => {
    if (weekEvents.length === 0) return;

    const startTime = Date.now();
    let animFrame: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / ROTATE_INTERVAL, 1);
      setProgress(p);

      if (p < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        setActiveIndex((prev) => (prev + 1) % weekEvents.length);
        setProgress(0);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [activeIndex, weekEvents.length]);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-title">Failed to load events</p>
          <pre className="error-detail">{error}</pre>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="loading-container">
        Loading events...
      </div>
    );
  }

  const carouselEvents = weekEvents.length > 0 ? weekEvents : events;
  const safeIndex = activeIndex % carouselEvents.length;

  return (
    <div className="app-layout">
      {/* Top: Event highlight carousel */}
      <div className="app-highlight">
        <EventHighlight event={carouselEvents[safeIndex]!} />
      </div>

      {/* Carousel pips */}
      <CarouselPips
        total={carouselEvents.length}
        activeIndex={safeIndex}
        progress={progress}
      />

      {/* Bottom: Week calendar */}
      <WeekCalendar events={events} activeEventId={carouselEvents[safeIndex]?.id} />
    </div>
  );
}
