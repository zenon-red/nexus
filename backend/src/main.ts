import { loadConfig } from "./config.ts";
import { createHandler } from "./handler.ts";

const kv = await Deno.openKv();
const config = loadConfig();

console.log(`OIDC server starting on port ${config.port}...`);
Deno.serve({ port: config.port, hostname: "0.0.0.0" }, createHandler(kv, { config }));
