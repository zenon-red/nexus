const PATCH_FLAG = "__nexus_spacetime_log_patch__";
const CONNECTED_FLAG = "__nexus_connected_log_once__";

const O_MACRON_ASCII = [
  "   ███████",
  "",
  "  █████████",
  " ███████████",
  "████     ████",
  "████     ████",
  "████     ████",
  " ███████████",
  "  █████████",
].join("\n");

export function quietSpacetimeLogs() {
  const g = globalThis as typeof globalThis & {
    [PATCH_FLAG]?: boolean;
  };

  if (g[PATCH_FLAG]) {
    return;
  }

  const originalLog = console.log.bind(console);

  console.log = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && first.includes("Connecting to SpacetimeDB WS...")) {
      return;
    }
    originalLog(...args);
  };

  g[PATCH_FLAG] = true;
}

export function logNexusConnected() {
  const g = globalThis as typeof globalThis & {
    [CONNECTED_FLAG]?: boolean;
  };

  if (g[CONNECTED_FLAG]) {
    return;
  }

  console.log(`\n${O_MACRON_ASCII}\n\nSuccessfully connected to Nexus. — ZŌE\n\nBuilt by Aliens.`);
  g[CONNECTED_FLAG] = true;
}
