import { useState, useEffect, useCallback, useMemo } from "react";
import type { MeetupEvent } from "../types";
import { EventHighlight } from "./EventHighlight";
import { WeekCalendar } from "./WeekCalendar";
import { CarouselPips } from "./CarouselPips";

const ROTATE_INTERVAL = 15_000; // 15 seconds per event
const REFRESH_INTERVAL = 30 * 60_000; // 30 minutes

function getWeekEvents(events: MeetupEvent[]): MeetupEvent[] {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);
  return events.filter((e) => {
    const d = new Date(e.dateTime);
    return d >= now && d <= weekEnd;
  });
}

export function App() {
  const [events, setEvents] = useState<MeetupEvent[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = (await res.json()) as MeetupEvent[];
      setEvents(data);
    } catch (e) {
      console.error("Failed to fetch events", e);
    }
  }, []);

  const weekEvents = useMemo(() => getWeekEvents(events), [events]);

  // Fetch events on mount and every 30 minutes
  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, REFRESH_INTERVAL);
    return () => clearInterval(id);
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

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-gray-400 text-2xl">
        Loading events...
      </div>
    );
  }

  const carouselEvents = weekEvents.length > 0 ? weekEvents : events;
  const safeIndex = activeIndex % carouselEvents.length;

  return (
    <div className="h-screen flex flex-col bg-white text-black">
      {/* Top: Event highlight carousel */}
      <div className="flex-1 min-h-0 relative">
        <EventHighlight event={carouselEvents[safeIndex]!} />
      </div>

      {/* Carousel pips */}
      <CarouselPips
        total={carouselEvents.length}
        activeIndex={safeIndex}
        progress={progress}
      />

      {/* Bottom: Week calendar */}
      <WeekCalendar events={events} />
    </div>
  );
}
