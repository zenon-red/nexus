"use client";

import { useMemo, useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { Matrix, type Frame } from "./matrix";

const ANIM_ROWS = 12;
const ANIM_COLS = 18;
const OMACRON_ROWS = 18;
const OMACRON_COLS = 28;
const FRAME_COUNT = 20;
const BASE_INTENSITY = 0.05;

function generateWaveFrame(frameIndex: number, rows: number, cols: number): Frame {
  const phase = (frameIndex / FRAME_COUNT) * Math.PI * 2;

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const waveA = Math.sin(phase + col * 0.32);
      const waveB = Math.sin(phase * 1.8 + row * 0.55 + col * 0.08);
      const pulse = Math.sin(phase * 0.9 + (row + col) * 0.14);

      const value = BASE_INTENSITY + Math.max(0, waveA * 0.45 + waveB * 0.35 + pulse * 0.25);
      return Math.min(1, value);
    }),
  );
}

function generatePulseFrame(frameIndex: number, rows: number, cols: number): Frame {
  const phase = (frameIndex / FRAME_COUNT) * Math.PI * 2;
  const cx = cols / 2;
  const cy = rows / 2;
  const maxRadius = Math.max(rows, cols) / 2;
  const pulseRadius = ((Math.sin(phase) + 1) / 2) * maxRadius;

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const dist = Math.sqrt((row - cy) ** 2 + (col - cx) ** 2);
      const diff = Math.abs(dist - pulseRadius);
      if (diff < 2.2) {
        return BASE_INTENSITY + (1 - diff / 2.2) * 0.9;
      }
      return BASE_INTENSITY;
    }),
  );
}

function generateLargeOMacron(): Frame {
  const frame: Frame = Array.from({ length: OMACRON_ROWS }, () =>
    Array.from({ length: OMACRON_COLS }, () => BASE_INTENSITY),
  );

  const cx = Math.floor(OMACRON_COLS / 2);
  const cy = Math.floor(OMACRON_ROWS / 2) + 2;
  const radius = Math.min(OMACRON_ROWS, OMACRON_COLS) * 0.35;

  for (let r = 0; r < OMACRON_ROWS; r++) {
    for (let c = 0; c < OMACRON_COLS; c++) {
      const dist = Math.sqrt((r - cy) ** 2 + (c - cx) ** 2);
      const diff = Math.abs(dist - radius);
      if (diff < 1.5) {
        frame[r][c] = 1;
      }
    }
  }

  const macronY = Math.floor(cy - radius - 3);
  const macronHalf = Math.floor(radius * 0.6);
  for (let c = cx - macronHalf; c <= cx + macronHalf; c++) {
    if (c >= 0 && c < OMACRON_COLS && macronY >= 0 && macronY < OMACRON_ROWS) {
      frame[macronY][c] = 1;
      if (macronY + 1 < OMACRON_ROWS) frame[macronY + 1][c] = 1;
    }
  }

  return frame;
}

function generateCompactOMacron(): Frame {
  const frame: Frame = Array.from({ length: ANIM_ROWS }, () =>
    Array.from({ length: ANIM_COLS }, () => BASE_INTENSITY),
  );

  const cx = Math.floor(ANIM_COLS / 2);
  const cy = Math.floor(ANIM_ROWS / 2);

  const outerRadius = 4.8;
  const innerRadius = 2.8;

  for (let r = 0; r < ANIM_ROWS; r++) {
    for (let c = 0; c < ANIM_COLS; c++) {
      const dist = Math.sqrt((r - cy) ** 2 + (c - cx) ** 2);
      if (dist <= outerRadius && dist >= innerRadius) {
        frame[r][c] = 1;
      }
    }
  }

  const macronY = 0;
  const macronHalf = 2;
  for (let c = cx - macronHalf; c <= cx + macronHalf; c++) {
    if (c >= 0 && c < ANIM_COLS) {
      frame[macronY][c] = 1;
    }
  }

  return frame;
}

type Mode = "wave" | "pulse" | "omacron";

const modeSequence: Mode[] = ["wave", "pulse", "omacron"];
const modeDurations: Record<Mode, number> = {
  wave: 5000,
  pulse: 4000,
  omacron: 4000,
};

interface MatrixGridProps {
  className?: string;
  forcedMode?: Mode;
}

export function MatrixGrid({ className, forcedMode }: MatrixGridProps) {
  const [modeIndex, setModeIndex] = useState(0);
  const mode = forcedMode ?? modeSequence[modeIndex];

  useEffect(() => {
    if (forcedMode) return;

    const timeout = setTimeout(() => {
      setModeIndex((prev) => (prev + 1) % modeSequence.length);
    }, modeDurations[mode]);

    return () => clearTimeout(timeout);
  }, [forcedMode, mode, modeIndex]);

  const waveFrames = useMemo(
    () =>
      Array.from({ length: FRAME_COUNT }, (_, index) =>
        generateWaveFrame(index, ANIM_ROWS, ANIM_COLS),
      ),
    [],
  );

  const pulseFrames = useMemo(
    () =>
      Array.from({ length: FRAME_COUNT }, (_, index) =>
        generatePulseFrame(index, ANIM_ROWS, ANIM_COLS),
      ),
    [],
  );

  const oMacronPattern = useMemo(() => {
    generateLargeOMacron();
    return generateCompactOMacron();
  }, []);

  const frames = mode === "wave" ? waveFrames : mode === "pulse" ? pulseFrames : undefined;
  const pattern = mode === "omacron" ? oMacronPattern : undefined;
  const isOmacron = mode === "omacron";

  return (
    <div
      className={cn(
        "absolute inset-0 -top-10 -left-1 flex h-full w-full items-center justify-center sm:-top-12",
        className,
      )}
    >
      <Matrix
        rows={ANIM_ROWS}
        cols={ANIM_COLS}
        frames={frames}
        pattern={pattern}
        fps={isOmacron ? 10 : 8}
        loop={!isOmacron}
        autoplay={!isOmacron}
        size={14}
        gap={4}
        enableGlow={isOmacron}
        pixelTransition={false}
        activeScale={isOmacron ? 1.1 : 1}
        palette={{
          on: "currentColor",
          off: "var(--muted-foreground)",
        }}
        ariaLabel="Animated matrix background"
      />
    </div>
  );
}
