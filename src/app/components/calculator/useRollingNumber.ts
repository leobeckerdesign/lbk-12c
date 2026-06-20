import { useEffect, useState } from "react";
import { animate } from "motion/react";

/** Smoothly rolls a displayed number toward `target` whenever it changes. */
export function useRollingNumber(target: number, duration = 0.55): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const controls = animate(display, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // Only re-run when the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}
