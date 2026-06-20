import { useState } from "react";
import { Html } from "@react-three/drei";
import { Info } from "lucide-react";
import { COLORS, DOT, MONO, SCAN } from "../calculator/tokens";
import { LogoMark } from "../calculator/Primitives";
import { useRollingNumber } from "../calculator/useRollingNumber";
import { formatNumber } from "../calculator/pricing";
import { MethodologyModal } from "../calculator/MethodologyModal";
import { useCalculator } from "./CalculatorContext";

// Pixel canvas for the readout DOM, mapped onto the 3D glass.
const PX_W = 860;
const PX_H = 360;
const SCALE = 0.175; // drei transform scale tuned so the DOM fills the glass

export function ScreenReadout() {
  const { show, projectPrice, servicesLine, selectorsLine } = useCalculator();
  const rolled = useRollingNumber(show ? projectPrice : 0);
  const bigText = show ? formatNumber(rolled) : "0";
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <Html
      transform
      position={[0, 0.34, -1.28]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={SCALE}
      pointerEvents="none"
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          width: PX_W,
          height: PX_H,
          position: "relative",
          padding: "26px 30px",
          boxSizing: "border-box",
          fontFamily: MONO,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LogoMark size={18} />
            <span style={{ fontFamily: SCAN, color: COLORS.teal, fontSize: 19, letterSpacing: "0.04em" }}>
              LBK-12C
            </span>
          </div>
          <div
            style={{
              textAlign: "right",
              fontFamily: MONO,
              color: "#bcae8f",
              fontSize: 15,
              letterSpacing: "0.12em",
              lineHeight: 1.7,
            }}
          >
            <div style={{ minHeight: "1.2em" }}>{servicesLine || " "}</div>
            <div>{selectorsLine}</div>
          </div>
        </div>

        {/* big number */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingTop: 14 }}>
          <div
            style={{
              fontFamily: DOT,
              fontWeight: 400,
              fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0, "slnt" 0',
              color: COLORS.orangeHot,
              fontSize: 132,
              lineHeight: 1,
              letterSpacing: "0.02em",
              marginRight: "-0.04em",
              textAlign: "right",
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
            opacity: 0.65,
            cursor: "pointer",
            lineHeight: 0,
            pointerEvents: "auto",
            background: "none",
            border: "none",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.color = COLORS.orange;
          }}
          onMouseLeave={(e) => {
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
