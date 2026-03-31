import { type MeetupEvent, MeetupResponseSchema } from "./types";
import removeMd from "remove-markdown";

export async function fetchUpcomingEvents(): Promise<MeetupEvent[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const res = await fetch("https://www.meetup.com/gql2", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "apollographql-client-name": "nextjs-web",
    },
    body: JSON.stringify({
      operationName: "getUpcomingGroupEvents",
      variables: {
        urlname: "noisebridge",
        afterDateTime: startOfDay.toISOString(),
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            "066e3709c68718d5ce9dd909e979ac70f99835fb3722cef77756ded808d5ca08",
        },
      },
    }),
  });

  const json: unknown = await res.json();
  const parsed = MeetupResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Invalid Meetup API response: ${parsed.error.message}`);
  }

  const edges = parsed.data.data.groupByUrlname.events.edges;

  const events: MeetupEvent[] = [];
  for (const edge of edges) {
    const node = edge.node;
    if (node.status === "CANCELLED") continue;

    const photo = node.featuredEventPhoto ?? node.displayPhoto;
    const imageUrl = photo?.highResUrl;

    const event: MeetupEvent = {
      id: node.id,
      title: node.title,
      eventUrl: node.eventUrl,
      description: removeMd(node.description ?? ""),
      dateTime: node.dateTime,
      endTime: node.endTime,
      status: node.status,
    };
    if (imageUrl) event.imageUrl = imageUrl;
    events.push(event);
  }
  return events;
}
