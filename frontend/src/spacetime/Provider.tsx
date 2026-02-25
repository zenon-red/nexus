import { useMemo, type ReactNode } from "react";
import { SpacetimeDBProvider } from "spacetimedb/react";
import { DbConnection } from "@/spacetime/generated";
import { logNexusConnected } from "@/lib/quietSpacetimeLogs";

const HOST = import.meta.env.VITE_SPACETIME_HOST || "ws://127.0.0.1:3000";
const MODULE = import.meta.env.VITE_SPACETIME_MODULE || "nexus";
const TOKEN_KEY = "nexus_token";

interface SpacetimeProviderProps {
  children: ReactNode;
}

export function SpacetimeProvider({ children }: SpacetimeProviderProps) {
  const builder = useMemo(() => {
    const token = localStorage.getItem(TOKEN_KEY) || undefined;

    return DbConnection.builder()
      .withUri(HOST)
      .withDatabaseName(MODULE)
      .withToken(token)
      .onConnect((_ctx, _identity, authToken) => {
        localStorage.setItem(TOKEN_KEY, authToken);
        logNexusConnected();
      });
  }, []);

  return <SpacetimeDBProvider connectionBuilder={builder}>{children}</SpacetimeDBProvider>;
}
