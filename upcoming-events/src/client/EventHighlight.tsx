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
    <div className="h-full flex p-6 gap-6">
      {/* Image */}
      {event.imageUrl && (
        <div className="w-1/2 h-full">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
      )}

      {/* Details */}
      <div
        className={`${event.imageUrl ? "w-1/2" : "w-full"} flex flex-col justify-start overflow-hidden relative`}
      >
        <div className="absolute top-0 right-0">
          <QRCodeSVG value={event.eventUrl} size={128} />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-black leading-tight pr-36">
          {event.title}
        </h1>
        <div className="text-2xl text-gray-700 mb-1">{formatDate(event.dateTime)}</div>
        <div className="text-xl text-gray-500 mb-6">
          {formatTime(event.dateTime)} &ndash; {formatTime(event.endTime)}
        </div>
        <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
          {truncated}
        </p>
      </div>
    </div>
  );
}
