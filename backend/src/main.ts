import { PORT } from "./config.ts";
import { createHandler } from "./handler.ts";

const kv = await Deno.openKv();

console.log(`OIDC server starting on port ${PORT}...`);
Deno.serve({ port: PORT, hostname: "0.0.0.0" }, createHandler(kv));
