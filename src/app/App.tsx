import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Leva, useControls, folder, button } from "leva";
import { Device } from "./components/calculator/Device";
import { COLORS } from "./components/calculator/tokens";
import { Scene } from "./components/calculator3d/Scene";
import {
  loadLayout,
  saveLayout,
  isEditMode,
  type Layout,
} from "./components/calculator3d/layout";

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

/** Site footer credit. */
function Footer() {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 16,
        left: 0,
        right: 0,
        textAlign: "right",
        textTransform: "uppercase",
        padding: "0 24px",
        boxSizing: "border-box",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: "0.08em",
        color: "rgba(214, 205, 184, 0.5)",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      LEO BECKER® MEDIA HOUSE 2026
    </footer>
  );
}

/** Site header title. */
function Header() {
  return (
    <header
      style={{
        position: "fixed",
        top: 16,
        left: 0,
        right: 0,
        textAlign: "left",
        textTransform: "uppercase",
        padding: "0 24px",
        boxSizing: "border-box",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: "0.08em",
        color: "rgba(214, 205, 184, 0.5)",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      LBK-12C | Freelancer Calculator V.1.0
    </header>
  );
}

function buildSchema(init: Layout) {
  const n = (value: number, min: number, max: number, step = 0.01) => ({ value, min, max, step });
  return {
    "Copiar layout (p/ congelar)": button(() => {
      const json = localStorage.getItem("lbk-12c-layout-v1") || "{}";
      try {
        navigator.clipboard.writeText(json);
      } catch {
        /* ignore */
      }
      // eslint-disable-next-line no-console
      console.log("LBK_LAYOUT_EXPORT", json);
      alert("Layout copiado! Cole aqui no chat pra eu congelar no código.");
    }),
    Device: folder(
      {
        devW: n(init.devW, 3, 6),
        devD: n(init.devD, 3, 6),
        devT: n(init.devT, 0.3, 0.8),
      },
      { collapsed: true },
    ),
    Tela: folder(
      {
        scrZ: n(init.scrZ, -3, 0),
        scrW: n(init.scrW, 2, 4),
        scrD: n(init.scrD, 0.8, 2.5),
      },
      { collapsed: true },
    ),
    Teclas: folder(
      {
        keyZ: n(init.keyZ, -1.5, 1),
        keyW: n(init.keyW, 0.6, 1.6),
        keyD: n(init.keyD, 0.3, 0.9),
        keySpread: n(init.keySpread, 0.8, 1.8),
      },
      { collapsed: true },
    ),
    Knobs: folder(
      {
        knobZ: n(init.knobZ, -0.5, 2),
        knobCellW: n(init.knobCellW, 0.8, 1.6),
        knobCellD: n(init.knobCellD, 0.9, 2),
        knobSpread: n(init.knobSpread, 0.9, 1.8),
        knobR: n(init.knobR, 0.25, 0.55),
      },
      { collapsed: true },
    ),
    Botoes: folder(
      {
        btnZ: n(init.btnZ, 0.5, 2.5),
        btnW: n(init.btnW, 1, 2.2),
        btnD: n(init.btnD, 0.4, 1.1),
        btnGap: n(init.btnGap, 0, 0.4),
      },
      { collapsed: true },
    ),
    Camera: folder(
      {
        camFov: n(init.camFov, 8, 40, 0.5),
        camTilt: n(init.camTilt, 0, 12, 0.1),
        fitMargin: n(init.fitMargin, 1, 1.6),
      },
      { collapsed: true },
    ),
  };
}

function App3D() {
  const init = useMemo(loadLayout, []);
  const edit = useMemo(isEditMode, []);
  const [values, set] = useControls(() => buildSchema(init));
  const layout = values as unknown as Layout;

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  return (
    <div className="size-full" style={{ background: pageBg }}>
      <Header />
      <Leva hidden={!edit} collapsed={false} titleBar={{ title: "LBK-12C · layout" }} />
      <Suspense fallback={null}>
        <Scene layout={layout} set={(p) => set(p as never)} edit={edit} />
      </Suspense>
      <Footer />
    </div>
  );
}

export default function App() {
  const webgl = useMemo(hasWebGL, []);
  return webgl ? <App3D /> : <Fallback2D />;
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
      <Header />
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", transition: "transform 0.15s ease-out" }}>
        <div ref={deviceRef}>
          <Device />
        </div>
      </div>
      <Footer />
    </div>
  );
}
