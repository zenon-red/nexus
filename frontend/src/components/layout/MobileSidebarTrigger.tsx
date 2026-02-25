import { m } from "motion/react";
import { useSidebar } from "@/components/animate-ui/components/radix/sidebar";
import { PanelLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileSidebarTriggerProps {
  className?: string;
}

export function MobileSidebarTrigger({ className }: MobileSidebarTriggerProps) {
  const { toggleSidebar, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <m.button
      onClick={toggleSidebar}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface-elevated transition-all hover:border-primary/50 hover:bg-surface-overlay",
        className,
      )}
      whileHover={{ scale: 1.05, x: 2 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Open sidebar"
    >
      <PanelLeftIcon className="h-5 w-5 text-foreground" />
    </m.button>
  );
}
