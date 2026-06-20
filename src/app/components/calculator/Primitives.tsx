import { motion } from "motion/react";
import svgPaths from "../../../imports/Frame1/svg-hvxqzxl2ae";
import { COLORS } from "./tokens";

/** Small status LED. Glows orange when active, sits dim otherwise. */
export function Led({ active, size = 10 }: { active: boolean; size?: number }) {
  return (
    <motion.span
      aria-hidden
      animate={{
        backgroundColor: active ? COLORS.orangeHot : "#2a2a22",
        boxShadow: active
          ? `0 0 6px 1px ${COLORS.orangeHot}, 0 0 12px 2px rgba(240,85,36,0.55)`
          : "inset 0 1px 2px rgba(0,0,0,0.6)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-block",
      }}
    />
  );
}

/** The orange swirl brand mark, rendered from the imported Figma SVG path. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size, display: "inline-block" }}
      aria-label="LBK logo"
    >
      <svg viewBox="0 0 35 35" fill="none" preserveAspectRatio="none" className="block size-full">
        <path d={svgPaths.p4254d00} fill={COLORS.orangeHot} />
      </svg>
    </span>
  );
}
