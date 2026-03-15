import type { MeetupEvent } from "./types";
import removeMd from "remove-markdown";

export async function fetchUpcomingEvents(): Promise<MeetupEvent[]> {
  const now = new Date().toISOString();
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
        afterDateTime: now,
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

  const json = (await res.json()) as {
    data?: { groupByUrlname?: { events?: { edges?: Array<{ node: Record<string, unknown> }> } } };
  };
  const edges = json?.data?.groupByUrlname?.events?.edges ?? [];

  return edges
    .map((edge: any) => {
      const node = edge.node;
      if (node.status === "CANCELLED") return null;

      const photo = node.featuredEventPhoto ?? node.displayPhoto;
      const imageUrl = photo?.highResUrl ?? null;

      return {
        id: node.id,
        title: node.title,
        eventUrl: node.eventUrl,
        description: removeMd(node.description ?? ""),
        dateTime: node.dateTime,
        endTime: node.endTime,
        status: node.status,
        imageUrl,
      } satisfies MeetupEvent;
    })
    .filter(Boolean) as MeetupEvent[];
}
