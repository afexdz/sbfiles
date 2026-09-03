"use client";

import { useRef, useEffect, useCallback, ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxX?: number;
  maxY?: number;
  innerClassName?: string;
}

export function TiltCard({
  children,
  maxX = 11,
  maxY = 14,
  className,
  innerClassName,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (reducedRef.current || !el || e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.transition = "transform 90ms linear, box-shadow 0.4s";
      el.style.transform = `rotateX(${(0.5 - y) * maxX}deg) rotateY(${(x - 0.5) * maxY}deg) translateZ(10px)`;
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
    },
    [maxX, maxY]
  );

  const handleLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = "transform 550ms cubic-bezier(.2,.8,.3,1), box-shadow 0.4s";
    el.style.transform = "";
  }, []);

  return (
    <div
      className={cn("group shrink-0", className)}
      style={{ perspective: "1000px" }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...props}
    >
      <div
        ref={cardRef}
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        className={cn("relative", innerClassName)}
      >
        {children}
      </div>
    </div>
  );
}

/* Glare overlay — place inside a TiltCard child, it inherits --gx/--gy */
export function Glare({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 rounded-[inherit] pointer-events-none z-[4]",
        "mix-blend-soft-light opacity-0 group-hover:opacity-100 transition-opacity duration-[350ms]",
        className
      )}
      style={{
        background:
          "radial-gradient(340px circle at var(--gx, 50%) var(--gy, 0%), rgba(255,255,255,.6), transparent 46%)",
      }}
    />
  );
}
