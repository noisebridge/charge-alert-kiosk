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

export function EventHighlight({ event }: { event: MeetupEvent }) {
  const description = event.description;
  const truncated =
    description.length > 300 ? description.slice(0, 300) + "..." : description;

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
          <QRCodeSVG value={event.eventUrl} size={128} />
        </div>
        <h1 className="highlight-title">
          {event.title}
        </h1>
        <div className="highlight-date">{formatDate(event.dateTime)}</div>
        <div className="highlight-time">
          {formatTime(event.dateTime)} &ndash; {formatTime(event.endTime)}
        </div>
        <p className="highlight-desc">
          {truncated}
        </p>
      </div>
    </div>
  );
}
