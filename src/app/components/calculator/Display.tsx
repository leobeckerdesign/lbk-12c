import { useState } from "react";
import { motion } from "motion/react";
import { Info } from "lucide-react";
import { COLORS, DOT, MONO, SCAN } from "./tokens";
import { LogoMark } from "./Primitives";
import { useRollingNumber } from "./useRollingNumber";
import { formatNumber } from "./pricing";
import { MethodologyModal } from "./MethodologyModal";

interface DisplayProps {
  servicesLine: string;
  selectorsLine: string;
  projectPrice: number;
  show: boolean;
  flash: boolean;
}

export function Display({
  servicesLine,
  selectorsLine,
  projectPrice,
  show,
  flash,
}: DisplayProps) {
  const rolled = useRollingNumber(show ? projectPrice : 0);
  const bigText = show ? formatNumber(rolled) : "0";
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <motion.div
      className="relative overflow-hidden"
      animate={{
        boxShadow: flash
          ? `inset 0 0 36px 6px rgba(232,99,42,0.55), inset 0 2px 10px rgba(0,0,0,0.7)`
          : `inset 0 0 22px 4px rgba(0,0,0,0.65), inset 0 2px 8px rgba(0,0,0,0.8)`,
      }}
      transition={{ duration: 0.25 }}
      style={{
        background: `radial-gradient(120% 140% at 50% 0%, ${COLORS.screen} 0%, ${COLORS.screenDeep} 100%)`,
        borderRadius: "16px 16px 10px 10px",
        padding: "clamp(14px, 3.5%, 22px)",
        minHeight: 0,
      }}
    >
      {/* scanline sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
          opacity: 0.5,
          mixBlendMode: "multiply",
        }}
      />

      {/* header row */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <LogoMark size={15} />
          <span
            style={{
              fontFamily: SCAN,
              color: COLORS.teal,
              fontSize: "clamp(10px, 2.6vw, 16px)",
              letterSpacing: "0.04em",
            }}
          >
            LBK-12C
          </span>
        </div>
        <div
          className="text-right"
          style={{
            fontFamily: MONO,
            color: "#bcae8f",
            fontSize: "clamp(8px, 1.7vw, 12px)",
            letterSpacing: "0.12em",
            lineHeight: 1.7,
          }}
        >
          <div style={{ minHeight: "1.2em" }}>{servicesLine || " "}</div>
          <div>{selectorsLine}</div>
        </div>
      </div>

      {/* big number */}
      <div className="relative flex items-center justify-end" style={{ padding: "2% 0 0" }}>
        <motion.div
          key={bigText.length}
          style={{
            fontFamily: DOT,
            // Bitcount is a pixel-grid variable font: ELSH 0 = round dots
            // (dot-matrix), ELXP 0 keeps the dots separated, CRSV 0 = upright.
            // wght 400 reads as distinct dots; the "." is a real single-dot
            // glyph, so no manual separator is needed.
            fontWeight: 400,
            fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0, "slnt" 0',
            color: COLORS.orangeHot,
            fontSize: "clamp(40px, 12.75vw, 98px)",
            lineHeight: 1,
            letterSpacing: "0.02em",
            textAlign: "right",
            whiteSpace: "nowrap",
            // Pull the dot-matrix glyph's right side-bearing back so the digits'
            // visible right edge lines up with the header text and the info icon.
            marginRight: "-0.04em",
            textShadow: `0 0 8px rgba(240,85,36,0.43), 0 0 20px rgba(240,85,36,0.28), 0 0 40px rgba(240,85,36,0.15)`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {bigText}
        </motion.div>
      </div>

      {/* info: methodology & sources */}
      <button
        type="button"
        onClick={() => setInfoOpen(true)}
        aria-label="Metodologia e fontes dos preços"
        className="absolute"
        style={{
          bottom: 8,
          right: 13,
          color: "#bcae8f",
          opacity: 0.6,
          cursor: "pointer",
          lineHeight: 0,
          transition: "opacity 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.color = COLORS.orange;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.6";
          e.currentTarget.style.color = "#bcae8f";
        }}
      >
        <Info size={17} />
      </button>

      <MethodologyModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </motion.div>
  );
}
