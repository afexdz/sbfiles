"use client";

import { useRef, useEffect } from "react";
import { BrandCard } from "@/components/BrandCard";
import type { Brand } from "@/lib/types";

// Inertia damping per frame (~0.95 = comfortable coast, matches ~0.5s stop)
const DAMPING = 0.95;
// How fast auto-scroll resumes after a drag: fraction added per frame (0→1)
// 0.003 ≈ 330 frames ≈ 5.5 s at 60 fps — long enough to feel natural
const RESUME_RATE = 0.003;
// Minimum px drag before a pointerdown→pointerup is treated as a drag (not a click)
const DRAG_THRESHOLD = 5;

const HIDDEN_SLUGS = new Set(["tesla"]);

interface Props {
  brands: Brand[];
}

export function BrandMarquee({ brands }: Props) {
  const visible = brands.filter((b) => !HIDDEN_SLUGS.has(b.slug));

  if (visible.length === 0) {
    return (
      <p className="text-mute text-[14.5px] py-8 text-center">
        Aucune marque disponible pour l&apos;instant.
      </p>
    );
  }

  const half = Math.ceil(visible.length / 2);
  const row1 = visible.slice(0, half);
  const row2 = visible.slice(half).length > 0 ? visible.slice(half) : row1;

  return (
    <div className="flex flex-col gap-4">
      {/* direction=-1 → scrolls left, duration=48s matches original CSS */}
      <Track brands={[...row1, ...row1]} direction={-1} duration={48} eagerCount={8} />
      {/* direction=+1 → scrolls right, duration=60s matches original CSS */}
      <Track brands={[...row2, ...row2]} direction={1} duration={60} />
    </div>
  );
}

interface TrackProps {
  brands: Brand[];
  direction: -1 | 1;
  duration: number;
  eagerCount?: number;
}

function Track({ brands, direction, duration, eagerCount = 0 }: TrackProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current!;
    const track   = trackRef.current!;

    // Override any residual CSS animation (safety net)
    track.style.animation = "none";

    // ── Half-width cache (avoids forced reflow inside RAF) ────────────────────
    let halfWidth = track.scrollWidth / 2;
    const ro = new ResizeObserver(() => { halfWidth = track.scrollWidth / 2; });
    ro.observe(track);

    // ── Reduced-motion ────────────────────────────────────────────────────────
    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");

    // ── Animation state (plain vars, no React state — no re-render overhead) ──
    let pos          = 0;   // current translateX, kept in (-halfWidth, 0]
    let velocity     = 0;   // inertia, px/frame
    let autoFactor   = 1;   // 0 = paused, 1 = full auto speed
    let isDragging   = false;
    let didDrag      = false;
    let ptrStartX    = 0;
    let posAtStart   = 0;
    let lastPtrX     = 0;
    let lastPtrTime  = 0;
    let rafId        = 0;

    function currentAutoSpeed(): number {
      if (rmq.matches || halfWidth === 0) return 0;
      // Exact px/frame that reproduces the original CSS animation duration
      return (direction * halfWidth) / (duration * 60);
    }

    // ── RAF loop ──────────────────────────────────────────────────────────────
    function loop() {
      if (!isDragging) {
        velocity   *= DAMPING;
        if (Math.abs(velocity) < 0.05) velocity = 0;

        autoFactor  = Math.min(1, autoFactor + RESUME_RATE);
        pos        += velocity + autoFactor * currentAutoSpeed();
      }

      // Modulo wrap — seamless because the track is exactly 2× one set
      if (halfWidth > 0) {
        if (pos <= -halfWidth) pos += halfWidth;
        if (pos >  0)          pos -= halfWidth;
      }

      track.style.transform = `translateX(${pos}px)`;
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    // ── Pointer events (covers mouse + touch + stylus) ────────────────────────
    function onDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDragging  = true;
      didDrag     = false;
      autoFactor  = 0;
      velocity    = 0;
      ptrStartX   = e.clientX;
      posAtStart  = pos;
      lastPtrX    = e.clientX;
      lastPtrTime = e.timeStamp;
      wrapper.setPointerCapture(e.pointerId);
      wrapper.style.cursor = "grabbing";
    }

    function onMove(e: PointerEvent) {
      if (!isDragging) return;
      const dx = e.clientX - ptrStartX;
      if (Math.abs(dx) > DRAG_THRESHOLD) didDrag = true;
      pos = posAtStart + dx;

      // Velocity: exponential-smoothed instantaneous delta
      const dt = e.timeStamp - lastPtrTime;
      if (dt > 0) {
        const v = ((e.clientX - lastPtrX) / dt) * (1000 / 60);
        velocity = 0.7 * v + 0.3 * velocity;
      }
      lastPtrX    = e.clientX;
      lastPtrTime = e.timeStamp;
    }

    function onUp() {
      if (!isDragging) return;
      isDragging          = false;
      // autoFactor stays 0 → resumes gradually via RESUME_RATE in the loop
      wrapper.style.cursor = "grab";
    }

    function onCancel() {
      isDragging          = false;
      velocity            = 0;
      wrapper.style.cursor = "grab";
    }

    // Prevent link navigation after a drag gesture
    function onClick(e: MouseEvent) {
      if (didDrag) {
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      }
    }

    // ── Wheel (trackpad horizontal scroll / mouse wheel) ──────────────────────
    function onWheel(e: WheelEvent) {
      // Don't intercept pure vertical scrolls (let the page scroll normally)
      if (e.deltaX === 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
      e.preventDefault();

      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY * 0.5;
      pos        -= delta * 0.8;
      velocity    = -delta * 0.4;
      autoFactor  = 0;
    }

    wrapper.addEventListener("pointerdown",  onDown);
    wrapper.addEventListener("pointermove",  onMove);
    wrapper.addEventListener("pointerup",    onUp);
    wrapper.addEventListener("pointercancel", onCancel);
    wrapper.addEventListener("click",        onClick,   { capture: true });
    wrapper.addEventListener("wheel",        onWheel,   { passive: false });

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      wrapper.removeEventListener("pointerdown",  onDown);
      wrapper.removeEventListener("pointermove",  onMove);
      wrapper.removeEventListener("pointerup",    onUp);
      wrapper.removeEventListener("pointercancel", onCancel);
      wrapper.removeEventListener("click",        onClick,  { capture: true });
      wrapper.removeEventListener("wheel",        onWheel);
    };
  }, [direction, duration]);

  return (
    <div
      ref={wrapperRef}
      className="marquee h-32 sm:h-40"
      style={{ cursor: "grab", userSelect: "none", touchAction: "pan-y" }}
    >
      <div
        ref={trackRef}
        className="marquee-track"
        style={{ willChange: "transform" }}
      >
        {brands.map((brand, i) => (
          <BrandCard
            key={`${brand.id}-${i}`}
            name={brand.nom}
            slug={brand.slug}
            logoUrl={brand.logo_url}
            eager={i < eagerCount}
            highPriority={i < eagerCount}
          />
        ))}
      </div>
    </div>
  );
}
