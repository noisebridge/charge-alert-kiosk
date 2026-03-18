import type { MeetupEvent } from "../types";
import { QRCodeSVG } from "qrcode.react";

const TZ = "America/Los_Angeles";

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  });
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const nowDate = now.toLocaleDateString("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const eventDate = new Date(dateStr).toLocaleDateString("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  return nowDate === eventDate;
}

function isHappeningNow(startStr: string, endStr: string): boolean {
  const now = new Date();
  return now >= new Date(startStr) && now <= new Date(endStr);
}

export function EventHighlight({ event }: { event: MeetupEvent }) {
  const description = event.description;
  const truncated =
    description.length > 300 ? description.slice(0, 300) + "..." : description;

  const happeningNow = isHappeningNow(event.dateTime, event.endTime);
  const today = isToday(event.dateTime);

  return (
    <div className="highlight">
      {/* Image */}
      {event.imageUrl && (
        <div className="highlight-image-wrap">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="highlight-image"
          />
        </div>
      )}

      {/* Details */}
      <div
        className={`highlight-details ${event.imageUrl ? "highlight-details-half" : "highlight-details-full"}`}
      >
        <div className="highlight-qr">
          <QRCodeSVG value={event.eventUrl} size={144} fgColor="#ffffff" bgColor="#000000" />
          <span className="highlight-qr-label">Scan to Sign Up</span>
        </div>
        <h1 className="highlight-title">
          {event.title}
        </h1>
        <div className="highlight-date">{today ? "Today" : formatDate(event.dateTime)}</div>
        <div className="highlight-time">
          {happeningNow
            ? "Right Now!"
            : <>{formatTime(event.dateTime)} &ndash; {formatTime(event.endTime)}</>}
        </div>
        <p className="highlight-desc">
          {truncated}
        </p>
      </div>
    </div>
  );
}
