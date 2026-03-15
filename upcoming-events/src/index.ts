import { fetchUpcomingEvents } from "./api";
import homepage from "../public/index.html";

Bun.serve({
  port: 3000,
  routes: {
    "/": homepage,
    "/api/events": async () => {
      try {
        const events = await fetchUpcomingEvents();
        return Response.json(events);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        console.error("Failed to fetch events:", message);
        return Response.json({ error: message }, { status: 502 });
      }
    },
  },
  fetch(_req) {
    return new Response("Not found", { status: 404 });
  },
});

console.log("Server running at http://localhost:3000");
