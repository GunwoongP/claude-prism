import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createServer } from "node:net";
import { compileRoutes } from "./compile.js";
import { chatRoutes } from "./chat.js";

const app = new Hono();

app.use("/*", cors());

// Mount routes
app.route("/", compileRoutes);
app.route("/", chatRoutes);

const port = parseInt(process.env.PORT || "3001", 10);

// Check if port is already in use before starting
function isPortFree(p: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(p);
  });
}

async function main() {
  const free = await isPortFree(port);
  if (!free) {
    console.log(`Port ${port} already in use, sidecar likely already running`);
    process.exit(0);
  }

  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`Open-Prism sidecar running on port ${port}`);
}

main();
