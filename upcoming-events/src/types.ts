import { z } from "zod/v4";

const MeetupEventNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  eventUrl: z.string(),
  description: z.string().optional(),
  dateTime: z.string(),
  endTime: z.string(),
  status: z.string(),
  featuredEventPhoto: z.union([z.object({ highResUrl: z.string().optional() }), z.undefined(), z.null()]),
  displayPhoto: z.object({ highResUrl: z.string().optional() }).optional(),
});

export const MeetupResponseSchema = z.object({
  data: z.object({
    groupByUrlname: z.object({
      events: z.object({
        edges: z.array(z.object({ node: MeetupEventNodeSchema })),
      }),
    }),
  }),
});

export type MeetupEventNode = z.infer<typeof MeetupEventNodeSchema>;

export interface MeetupEvent {
  id: string;
  title: string;
  eventUrl: string;
  description: string;
  dateTime: string;
  endTime: string;
  status: string;
  imageUrl?: string;
}
