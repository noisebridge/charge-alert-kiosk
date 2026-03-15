import { fetchUpcomingEvents } from "./src/api";
import homepage from "./public/index.html";

Bun.serve({
  port: 3000,
  routes: {
    "/": homepage,
    "/api/events": async () => {
      const events = await fetchUpcomingEvents();
      return Response.json(events);
    },
  },
  fetch(_req) {
    return new Response("Not found", { status: 404 });
  },
});

console.log("Server running at http://localhost:3000");
