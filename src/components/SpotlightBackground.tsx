import * as React from "react";

type SpotlightBackgroundProps = {
  children: React.ReactNode;
  className?: string;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

/**
 * Signature moment: a subtle spotlight that follows the pointer.
 * It only updates CSS variables, so the paint stays cheap.
 */
export function SpotlightBackground({ children, className }: SpotlightBackgroundProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const setFromEvent = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * 100;
      const y = ((clientY - r.top) / r.height) * 100;
      el.style.setProperty("--spot-x", `${Math.max(0, Math.min(100, x))}%`);
      el.style.setProperty("--spot-y", `${Math.max(0, Math.min(100, y))}%`);
    };

    const onMove = (e: PointerEvent) => setFromEvent(e.clientX, e.clientY);
    const onLeave = () => {
      el.style.setProperty("--spot-x", "50%");
      el.style.setProperty("--spot-y", "20%");
    };

    // Initialize
    onLeave();

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
