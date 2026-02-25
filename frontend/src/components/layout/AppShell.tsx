import { ReactNode } from "react";
import { m, AnimatePresence, LayoutGroup } from "motion/react";
import { Link } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import { useMemo } from "react";
import { useAgents, useNow, splitAgentsByPresence } from "@/spacetime/hooks";

import { OnlineAgents, OfflineAgents } from "./AgentPresence";
import { MobileSidebarTrigger } from "./MobileSidebarTrigger";

interface AppShellProps {
  children: ReactNode;
}

function SidebarStats() {
  const { state, isMobile } = useSidebar();
  const isExpanded = state === "expanded";
  const agents = useAgents();
  const now = useNow();
  const { online: onlineAgents } = useMemo(() => splitAgentsByPresence(agents, now), [agents, now]);

  const onlineCount = onlineAgents.length;
  const offlineCount = agents.length - onlineCount;

  if (!isMobile && !isExpanded) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: 0.1,
      }}
      className="space-y-4 px-4 py-3"
    >
      <LayoutGroup>
        <m.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.2 }}
          className="space-y-4"
        >
          <div className="text-xs font-semibold tracking-wider text-foreground uppercase">
            Agents
          </div>

          <div>
            <span className="text-label text-muted-foreground">Online</span>
            <div className="mt-0.5 ml-0.5 text-2xl font-semibold text-foreground">
              {onlineCount}
            </div>
            <div className="mt-3">
              <OnlineAgents maxAvatars={8} />
            </div>
          </div>

          <div>
            <span className="text-label text-muted-foreground">Offline</span>
            <div className="mt-0.5 ml-0.5 text-lg font-medium text-muted-foreground">
              {offlineCount}
            </div>
            <div className="mt-2">
              <OfflineAgents maxAvatars={8} />
            </div>
          </div>
        </m.div>
      </LayoutGroup>
    </m.div>
  );
}

function SidebarHeaderContent() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className={`relative w-full ${isCollapsed ? "h-20" : "h-14"}`}>
          <AnimatePresence mode="wait">
            {isCollapsed ? (
              <m.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              >
                {!isMobile && (
                  <m.div
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                      delay: 0.05,
                    }}
                    className="flex items-center"
                  >
                    <SidebarTrigger className="shrink-0" />
                  </m.div>
                )}

                <Link to="/" className="flex w-full items-center justify-center">
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      delay: 0.05,
                    }}
                  >
                    <img
                      src={isMobile ? "/assets/zoe-wordmark.webp" : "/assets/zoe-icon.webp"}
                      alt="ZOE"
                      className={isMobile ? "h-8 w-auto object-contain" : "h-8 w-8 object-contain"}
                      draggable={false}
                    />
                  </m.div>
                </Link>
              </m.div>
            ) : (
              <m.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Link to="/" className="flex items-center gap-2">
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    <m.img
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        delay: 0.08,
                      }}
                      src="/assets/zoe-wordmark.webp"
                      alt="ZOE"
                      className="h-8 w-auto object-contain"
                      draggable={false}
                    />
                  </m.div>
                </Link>

                {!isMobile && (
                  <m.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                      delay: 0.12,
                    }}
                    className="absolute top-1/2 right-0 -translate-y-1/2"
                  >
                    <SidebarTrigger className="shrink-0" />
                  </m.div>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function PoweredByNexus() {
  const { state, isMobile } = useSidebar();
  const isExpanded = state === "expanded";

  if (isMobile) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-3"
      >
        <div className="mb-2 text-center text-label text-muted-foreground">Powered By</div>
        <div className="flex items-center justify-center">
          <img
            src="/assets/nexus-wordmark.webp"
            alt="Nexus"
            className="h-6 w-auto object-contain opacity-70"
            draggable={false}
          />
        </div>
      </m.div>
    );
  }

  if (!isExpanded) {
    return (
      <div className="flex justify-center py-2">
        <img
          src="/assets/nexus-icon.webp"
          alt="Nexus"
          className="h-8 w-8 object-contain opacity-50"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="px-4 py-3"
    >
      <div className="mb-2 text-center text-label text-muted-foreground">Powered By</div>
      <div className="flex items-center justify-center">
        <img
          src="/assets/nexus-wordmark.webp"
          alt="Nexus"
          className="h-6 w-auto object-contain opacity-70"
          draggable={false}
        />
      </div>
    </m.div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="dark min-h-screen bg-background">
      <SidebarProvider defaultOpen={false}>
        <m.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Sidebar variant="floating" collapsible="icon" className="border-border/50">
            <SidebarHeader>
              <SidebarHeaderContent />
            </SidebarHeader>

            <SidebarContent>
              <SidebarStats />
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem></SidebarMenuItem>
              </SidebarMenu>
              <PoweredByNexus />
            </SidebarFooter>

            <SidebarRail />
          </Sidebar>
        </m.div>

        <SidebarInset>
          <div className="absolute top-5 right-6 z-40 md:hidden">
            <MobileSidebarTrigger />
          </div>
          <main className="flex-1 overflow-hidden">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
