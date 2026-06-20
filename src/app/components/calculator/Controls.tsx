import { motion } from "motion/react";
import { COLORS, MONO } from "./tokens";

const keycapShadow =
  "0 4px 0 #9c8e72, 0 6px 8px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -2px 3px rgba(0,0,0,0.18)";
const keycapShadowPressed =
  "0 1px 0 #9c8e72, 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.18)";

/** A square beige service keycap with an LED status bar. */
export function ServiceKey({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      initial={false}
      whileTap={{ y: 3, boxShadow: keycapShadowPressed }}
      animate={{ y: 0, boxShadow: keycapShadow }}
      transition={{ type: "spring", stiffness: 600, damping: 18 }}
      className="relative flex flex-col items-center justify-between"
      style={{
        background: `linear-gradient(165deg, #e2d8bb 0%, ${COLORS.keycap} 55%, #b6a888 100%)`,
        borderRadius: 6,
        padding: "10px 6px 8px",
        cursor: "pointer",
        height: "100%",
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          color: COLORS.ink,
          fontSize: "clamp(8px, 1.7vw, 12px)",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        className="flex w-full items-center justify-center"
        style={{
          background: active ? COLORS.orangeHot : COLORS.panel,
          border: `1px solid ${active ? "#7a2f17" : COLORS.panelEdge}`,
          borderRadius: 2,
          height: 12,
          boxShadow: active ? "0 0 8px 1px rgba(240,85,36,0.7)" : "none",
          transition: "background 0.2s, box-shadow 0.2s",
        }}
      />
    </motion.button>
  );
}

const KNOB_ANGLES = [-48, 0, 48] as const;

/** One of the three position indicators around a knob. Green idle, orange when active. */
function PositionDot({ active, placement }: { active: boolean; placement: 0 | 1 | 2 }) {
  // placement: 0 = left, 1 = top-center (higher), 2 = right — forming an arc above the knob.
  const pos =
    placement === 1
      ? { top: 0, left: "50%", transform: "translateX(-50%)" }
      : placement === 0
        ? { top: 8, left: 0 }
        : { top: 8, right: 0 };

  return (
    <motion.span
      aria-hidden
      className="absolute"
      animate={{
        backgroundColor: active ? COLORS.orangeHot : COLORS.knobRing,
        boxShadow: active
          ? `0 0 6px 1px ${COLORS.orangeHot}, 0 0 12px 2px rgba(240,85,36,0.55)`
          : "inset 0 1px 2px rgba(0,0,0,0.55)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      style={{
        ...pos,
        width: "clamp(6px, 1.4vw, 9px)",
        height: "clamp(6px, 1.4vw, 9px)",
        borderRadius: "50%",
      }}
    />
  );
}

/** A 3-position rotary knob in a recessed panel, with a status LED above. */
export function Knob({
  label,
  position,
  valueLabel,
  onChange,
}: {
  label: string;
  position: 0 | 1 | 2;
  valueLabel: string;
  onChange: (pos: 0 | 1 | 2) => void;
}) {
  const cycle = () => onChange(((position + 1) % 3) as 0 | 1 | 2);

  return (
    <div
      className="flex flex-col items-center"
      style={{
        background: `linear-gradient(165deg, #e2d8bb 0%, ${COLORS.keycap} 55%, #b6a888 100%)`,
        borderRadius: 6,
        padding: "8px 6px 10px",
        boxShadow: "inset 0 2px 5px rgba(0,0,0,0.18), inset 0 -2px 4px rgba(255,255,255,0.4)",
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          color: COLORS.label,
          fontSize: "clamp(7px, 1.4vw, 10px)",
          letterSpacing: "0.1em",
          marginBottom: 6,
        }}
      >
        {label}
      </span>

      <div className="relative mt-1 flex items-center justify-center" style={{ width: "clamp(52px, 13vw, 96px)" }}>
        {/* 3 position dots: green by default, the active position glows orange */}
        {([0, 1, 2] as const).map((i) => (
          <PositionDot key={i} active={position === i} placement={i} />
        ))}

        <motion.button
          type="button"
          onClick={cycle}
          whileTap={{ scale: 0.94 }}
          className="relative mt-3 flex w-full items-center justify-center"
          style={{
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background: `radial-gradient(60% 60% at 38% 30%, #0a5249 0%, ${COLORS.knob} 70%)`,
            boxShadow:
              "0 4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.6)",
            cursor: "pointer",
          }}
          aria-label={`${label}: ${valueLabel}`}
        >
          <motion.span
            className="absolute"
            animate={{ rotate: KNOB_ANGLES[position] }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            style={{ width: "100%", height: "100%" }}
          >
            <span
              className="absolute left-1/2 top-[10%] -translate-x-1/2"
              style={{
                width: 4,
                height: "32%",
                borderRadius: 2,
                background: COLORS.keycap,
                boxShadow: "0 0 4px rgba(196,181,151,0.6)",
              }}
            />
          </motion.span>
        </motion.button>
      </div>

      <span
        style={{
          fontFamily: MONO,
          color: COLORS.ink,
          fontSize: "clamp(7px, 1.4vw, 10px)",
          letterSpacing: "0.08em",
          marginTop: 8,
        }}
      >
        {valueLabel}
      </span>
    </div>
  );
}

/** Large bottom action key (ZERAR / CALCULAR). */
export function BigKey({
  label,
  variant,
  onClick,
  side,
}: {
  label: string;
  variant: "beige" | "orange";
  onClick: () => void;
  side: "left" | "right";
}) {
  const isOrange = variant === "orange";
  const base = isOrange
    ? `linear-gradient(180deg, #ff7a44 0%, ${COLORS.orangeHot} 55%, #c8451d 100%)`
    : `linear-gradient(180deg, #e2d8bb 0%, ${COLORS.keycap} 55%, #b6a888 100%)`;
  const edge = isOrange ? "#9c350f" : "#9c8e72";
  const radius =
    side === "left" ? "6px 6px 6px 16px" : "6px 6px 16px 6px";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      whileTap={{ y: 4, boxShadow: `0 1px 0 ${edge}, 0 2px 5px rgba(0,0,0,0.4)` }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 16 }}
      className="flex items-center justify-center"
      style={{
        background: base,
        borderRadius: radius,
        boxShadow: `0 6px 0 ${edge}, 0 9px 12px rgba(0,0,0,0.45), inset 0 2px 2px rgba(255,255,255,0.4)`,
        padding: "clamp(14px, 4vw, 26px)",
        cursor: "pointer",
        width: "100%",
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          color: isOrange ? "#2a1208" : COLORS.ink,
          fontSize: "clamp(16px, 4vw, 30px)",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}
