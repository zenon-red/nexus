import { cn } from "@/lib/utils";

const capabilityColors: Record<string, string> = {
  reviewer: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  architect: "bg-purple-500/15 text-purple-500 border-purple-500/20",
  scout: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
};

interface CapabilityTagProps {
  capability: string;
  className?: string;
}

export function CapabilityTag({ capability, className }: CapabilityTagProps) {
  const normalized = capability.trim().toLowerCase();
  const colorClass = capabilityColors[normalized] || "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        colorClass,
        className,
      )}
    >
      {capability}
    </span>
  );
}
