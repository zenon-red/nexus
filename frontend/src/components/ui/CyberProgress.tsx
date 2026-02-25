"use client";

import { m } from "motion/react";

interface CyberProgressProps {
  value: number;
  max?: number;
  label?: string;
  color?: "primary" | "success" | "warning" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  showPercentage?: boolean;
}

export function CyberProgress({
  value,
  max = 100,
  label,
  color = "primary",
  size = "md",
  showPercentage = true,
}: CyberProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    primary: "from-primary/20 to-primary",
    success: "from-success/20 to-success",
    warning: "from-warning/20 to-warning",
    destructive: "from-destructive/20 to-destructive",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
    xl: "h-4",
  };

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between font-mono text-xs">
          {label && <span className="tracking-wider text-muted-foreground uppercase">{label}</span>}
          {showPercentage && (
            <span className="font-semibold text-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div
        className={`relative w-full ${sizeClasses[size]} overflow-hidden border border-border bg-surface-elevated`}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "linear-gradient(to right, oklch(0.3 0 0) 1px, transparent 1px)",
            backgroundSize: "4px 100%",
          }}
        />

        <m.div
          className={`absolute inset-y-0 left-0 bg-linear-to-r ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        <m.div
          className={`absolute inset-y-0 w-1 bg-linear-to-r from-transparent to-white/50`}
          initial={{ left: 0 }}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            opacity: percentage > 0 ? 1 : 0,
            boxShadow: "0 0 8px rgba(255,255,255,0.5)",
          }}
        />

        <div className="absolute inset-0 flex">
          {[25, 50, 75].map((marker) => (
            <div
              key={marker}
              className="absolute top-0 bottom-0 w-px bg-border"
              style={{ left: `${marker}%` }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-tiny text-muted-foreground">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
