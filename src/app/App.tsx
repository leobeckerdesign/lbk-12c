import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Device } from "./components/calculator/Device";
import { COLORS } from "./components/calculator/tokens";
import { Scene } from "./components/calculator3d/Scene";

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return (
      !!window.WebGLRenderingContext &&
      !!(c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

const pageBg = `radial-gradient(120% 120% at 50% 0%, ${COLORS.bgBottom} 0%, ${COLORS.bgTop} 70%)`;

export default function App() {
  const webgl = useMemo(hasWebGL, []);

  if (webgl) {
    return (
      <div className="size-full" style={{ background: pageBg }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>
    );
  }

  return <Fallback2D />;
}

/** CSS skeuomorphic device — used when WebGL is unavailable. */
function Fallback2D() {
  const deviceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const fit = () => {
      const el = deviceRef.current;
      if (!el) return;
      const { offsetWidth: w, offsetHeight: h } = el;
      if (!w || !h) return;
      const pad = 32;
      const next = Math.min(
        (window.innerWidth - pad) / w,
        (window.innerHeight - pad) / h,
      );
      setScale(Math.max(0.2, Math.min(next, 1.6)));
    };

    fit();
    window.addEventListener("resize", fit);
    const ro = new ResizeObserver(fit);
    if (deviceRef.current) ro.observe(deviceRef.current);
    return () => {
      window.removeEventListener("resize", fit);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className="flex size-full items-center justify-center overflow-hidden"
      style={{ background: pageBg }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          transition: "transform 0.15s ease-out",
        }}
      >
        <div ref={deviceRef}>
          <Device />
        </div>
      </div>
    </div>
  );
}
