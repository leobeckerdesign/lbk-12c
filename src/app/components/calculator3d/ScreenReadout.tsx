import { useState } from "react";
import { Html } from "@react-three/drei";
import { Info } from "lucide-react";
import { COLORS, DOT, MONO, SCAN } from "../calculator/tokens";
import { LogoMark } from "../calculator/Primitives";
import { useRollingNumber } from "../calculator/useRollingNumber";
import { formatNumber } from "../calculator/pricing";
import { MethodologyModal } from "../calculator/MethodologyModal";
import { useCalculator } from "./CalculatorContext";
import type { Layout } from "./layout";

// Pixel canvas for the readout DOM, mapped onto the 3D glass.
const PX_W = 860;
const PX_H = 442; // matches the glass aspect (~1.95) so the DOM isn't distorted

export function ScreenReadout({
  layout: L,
  position,
  rotation = [-Math.PI / 2, 0, 0],
  worldWidth,
}: {
  layout?: Layout;
  position?: [number, number, number];
  rotation?: [number, number, number];
  worldWidth?: number;
}) {
  const { show, projectPrice, servicesLine, selectorsLine } = useCalculator();
  const rolled = useRollingNumber(show ? projectPrice : 0);
  const bigText = show ? formatNumber(rolled) : "0";
  const [infoOpen, setInfoOpen] = useState(false);

  // px -> world, tuned so the DOM fills the glass. Works in both modes:
  // GLB passes the glass width directly; the legacy path derives it from layout.
  const scale = (worldWidth ?? (L ? L.scrW : 3.7)) * 0.0486;
  const pos: [number, number, number] =
    position ?? [0, (L ? L.devT / 2 : 0) + 0.08, L ? L.scrZ : 0];

  return (
    <Html
      transform
      position={pos}
      rotation={rotation}
      scale={scale}
      pointerEvents="none"
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          width: PX_W,
          height: PX_H,
          position: "relative",
          padding: "30px 34px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          fontFamily: MONO,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={34} />
            <span style={{ fontFamily: SCAN, color: COLORS.teal, fontSize: 24, letterSpacing: "0.04em" }}>
              LBK-12C
            </span>
          </div>
          <div
            style={{
              textAlign: "right",
              fontFamily: "'Bitcount Prop Single', monospace",
              fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0, "slnt" 0',
              fontWeight: 400,
              textTransform: "uppercase",
              color: "#bcae8f",
              fontSize: 32,
              letterSpacing: "0.04em",
              lineHeight: 1.05,
            }}
          >
            <div style={{ minHeight: "1.2em" }}>{servicesLine || "CONFIGURE ABAIXO"}</div>
            {servicesLine && <div>{selectorsLine}</div>}
          </div>
        </div>

        {/* big number — centered + large, matching the Figma display */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: DOT,
              fontWeight: 400,
              fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0, "slnt" 0',
              color: COLORS.orangeHot,
              fontSize: 194,
              lineHeight: 1,
              letterSpacing: "0.02em",
              textAlign: "center",
              opacity: infoOpen ? 0 : 1, // hide behind the methodology popup
              transition: "opacity 0.15s ease",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
              textShadow:
                "0 0 8px rgba(240,85,36,0.45), 0 0 20px rgba(240,85,36,0.3), 0 0 44px rgba(240,85,36,0.18)",
            }}
          >
            {bigText}
          </div>
        </div>

        {/* info button */}
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          aria-label="Metodologia e fontes dos preços"
          style={{
            position: "absolute",
            bottom: 22,
            right: 30,
            color: "#bcae8f",
            opacity: infoOpen ? 0 : 0.65,
            cursor: "pointer",
            lineHeight: 0,
            pointerEvents: infoOpen ? "none" : "auto",
            background: "none",
            border: "none",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (infoOpen) return; // don't override the hidden state when the popup is open
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.color = COLORS.orange;
          }}
          onMouseLeave={(e) => {
            if (infoOpen) return;
            e.currentTarget.style.opacity = "0.65";
            e.currentTarget.style.color = "#bcae8f";
          }}
        >
          <Info size={22} />
        </button>

        <MethodologyModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      </div>
    </Html>
  );
}
