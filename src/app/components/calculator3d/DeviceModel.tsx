import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox, Cylinder, Text } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import type { ThreeEvent } from "@react-three/fiber";
import { surface, MAT } from "./materials";
import { useCalculator } from "./CalculatorContext";
import { clickKey, clickButton, clickKnob } from "./useClickFeedback";
import type { Service } from "../calculator/pricing";

export const DEV = { w: 4.3, d: 4.7, t: 0.55 } as const;
const FONT = "/fonts/PPSupplyMono-Regular.ttf";

function setCursor(v: "pointer" | "auto") {
  document.body.style.cursor = v;
}

// ---- textured plastic material -----------------------------------------------
function Plastic({
  color = MAT.body,
  repeat = 6,
  rough = 1,
  clear = 0.22,
  normal = 0.5,
  env = 0.7,
}: {
  color?: string;
  repeat?: number;
  rough?: number;
  clear?: number;
  normal?: number;
  env?: number;
}) {
  const s = useMemo(() => surface(repeat), [repeat]);
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0}
      roughness={rough}
      roughnessMap={s.roughnessMap}
      normalMap={s.normalMap}
      normalScale={new THREE.Vector2(normal, normal)}
      envMapIntensity={env}
      clearcoat={clear}
      clearcoatRoughness={0.55}
    />
  );
}

function Label({
  children,
  position,
  size = 0.13,
  color = MAT.ink,
}: {
  children: string;
  position: [number, number, number];
  size?: number;
  color?: string;
}) {
  return (
    <Text
      font={FONT}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      letterSpacing={0.08}
    >
      {children}
    </Text>
  );
}

function Led({
  position,
  on,
  color = MAT.led,
  r = 0.045,
}: {
  position: [number, number, number];
  on: boolean;
  color?: string;
  r?: number;
}) {
  return (
    <Cylinder args={[r, r, 0.03, 20]} position={position}>
      <meshStandardMaterial
        color={on ? color : "#0c2b26"}
        emissive={on ? color : "#000000"}
        emissiveIntensity={on ? 2.6 : 0}
        roughness={0.5}
      />
    </Cylinder>
  );
}

// ---- screen -------------------------------------------------------------------
function Screen() {
  const z = -1.28;
  const { flash } = useCalculator();
  const { glow } = useSpring({ glow: flash ? 0.38 : 0, config: { tension: 220, friction: 16 } });
  return (
    <group>
      {/* raised bezel frame */}
      <RoundedBox args={[3.98, 0.22, 1.9]} radius={0.1} smoothness={8} position={[0, 0.26, z]} castShadow receiveShadow>
        <Plastic color={MAT.bodyDark} repeat={5} clear={0.15} />
      </RoundedBox>
      {/* recessed glass, sunk below the bezel lip */}
      <RoundedBox args={[3.6, 0.18, 1.54]} radius={0.045} smoothness={8} position={[0, 0.24, z]} receiveShadow>
        <animated.meshPhysicalMaterial
          color={MAT.screen}
          emissive={MAT.orange}
          emissiveIntensity={glow}
          roughness={0.22}
          metalness={0}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          envMapIntensity={0.9}
        />
      </RoundedBox>
    </group>
  );
}

// ---- service key --------------------------------------------------------------
function ServiceKey({ service, label, x }: { service: Service; label: string; x: number }) {
  const { isActive, toggleService } = useCalculator();
  const active = isActive(service);
  const [{ y }, api] = useSpring(() => ({ y: 0, config: { tension: 700, friction: 22 } }));

  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    clickKey();
    api.start({ y: -0.06 });
  };
  const up = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    api.start({ y: 0 });
    toggleService(service);
  };

  return (
    <group
      position={[x, 0, -0.12]}
      onPointerDown={down}
      onPointerUp={up}
      onPointerOver={(e) => {
        e.stopPropagation();
        setCursor("pointer");
      }}
      onPointerOut={() => {
        setCursor("auto");
        api.start({ y: 0 });
      }}
    >
      {/* recessed well */}
      <RoundedBox args={[1.2, 0.12, 0.56]} radius={0.05} smoothness={6} position={[0, 0.2, 0]} receiveShadow>
        <Plastic color={MAT.bodyDark} repeat={3} clear={0.1} />
      </RoundedBox>
      <animated.group position-y={y}>
        <RoundedBox args={[1.08, 0.26, 0.44]} radius={0.07} smoothness={8} position={[0, 0.31, 0]} castShadow receiveShadow>
          <Plastic color={MAT.keycap} repeat={3} clear={0.26} />
        </RoundedBox>
        <RoundedBox args={[0.8, 0.09, 0.1]} radius={0.03} smoothness={4} position={[0, 0.4, 0.1]}>
          <meshStandardMaterial
            color={active ? MAT.led : "#39342a"}
            emissive={active ? MAT.led : "#000000"}
            emissiveIntensity={active ? 2.3 : 0}
            roughness={0.6}
          />
        </RoundedBox>
        <Label position={[0, 0.45, -0.08]} size={0.1}>
          {label}
        </Label>
      </animated.group>
    </group>
  );
}

// ---- knob ---------------------------------------------------------------------
function Knob({
  label,
  value,
  x,
  pos,
  onCycle,
}: {
  label: string;
  value: string;
  x: number;
  pos: 0 | 1 | 2;
  onCycle: () => void;
}) {
  const z = 0.95;
  // Domed knob profile revolved around Y (gives a beveled, crowned top).
  const profile = useMemo(
    () =>
      [
        [0.43, 0.0],
        [0.43, 0.3],
        [0.42, 0.35],
        [0.385, 0.4],
        [0.31, 0.44],
        [0.18, 0.465],
        [0.0, 0.475],
      ].map(([px, py]) => new THREE.Vector2(px, py)),
    [],
  );

  const targetRot = pos === 0 ? 0.84 : pos === 2 ? -0.84 : 0;
  const { rot } = useSpring({ rot: targetRot, config: { tension: 320, friction: 17 } });
  const [{ s }, api] = useSpring(() => ({ s: 1, config: { tension: 700, friction: 20 } }));

  return (
    <group position={[x, 0, z]}>
      <Led position={[-0.5, 0.36, -0.42]} on={pos === 0} />
      <Led position={[0, 0.36, -0.56]} on={pos === 1} />
      <Led position={[0.5, 0.36, -0.42]} on={pos === 2} />

      <animated.group
        rotation-y={rot}
        scale={s}
        onPointerDown={(e) => {
          e.stopPropagation();
          clickKnob();
          api.start({ s: 0.95, onResolve: () => api.start({ s: 1 }) });
          onCycle();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setCursor("pointer");
        }}
        onPointerOut={() => setCursor("auto")}
      >
        <mesh position={[0, 0.27, 0]} castShadow receiveShadow>
          <latheGeometry args={[profile, 64]} />
          <meshPhysicalMaterial
            color={MAT.knob}
            roughness={0.36}
            metalness={0}
            clearcoat={0.7}
            clearcoatRoughness={0.28}
            envMapIntensity={1}
            normalMap={surface(7).normalMap}
            normalScale={new THREE.Vector2(0.18, 0.18)}
          />
        </mesh>
        <RoundedBox args={[0.04, 0.05, 0.22]} radius={0.015} smoothness={3} position={[0, 0.74, -0.15]}>
          <meshStandardMaterial color={MAT.keycap} roughness={0.5} />
        </RoundedBox>
      </animated.group>

      <Label position={[0, 0.37, -0.78]} size={0.1}>
        {label}
      </Label>
      <Label position={[0, 0.37, 0.56]} size={0.1}>
        {value}
      </Label>
    </group>
  );
}

function KnobPanel() {
  const c = useCalculator();
  return (
    <group>
      {/* recessed tray floor */}
      <RoundedBox args={[3.98, 0.12, 1.7]} radius={0.1} smoothness={8} position={[0, 0.2, 0.9]} receiveShadow>
        <Plastic color={MAT.bodyDark} repeat={5} clear={0.1} />
      </RoundedBox>
      <Knob label="EXPERIÊNCIA" value={c.experienceLabel} x={-1.18} pos={c.expPos} onCycle={c.cycleExp} />
      <Knob label="CLIENTE" value={c.clientLabel} x={0} pos={c.clientPos} onCycle={c.cycleClient} />
      <Knob label="OPORTUNIDADE" value={c.opportunityLabel} x={1.18} pos={c.oppPos} onCycle={c.cycleOpp} />
    </group>
  );
}

// ---- big button ---------------------------------------------------------------
function BigButton({
  label,
  x,
  orange,
  onClick,
}: {
  label: string;
  x: number;
  orange?: boolean;
  onClick: () => void;
}) {
  const [{ y }, api] = useSpring(() => ({ y: 0, config: { tension: 600, friction: 20 } }));
  return (
    <group
      position={[x, 0, 1.86]}
      onPointerDown={(e) => {
        e.stopPropagation();
        clickButton();
        api.start({ y: -0.08 });
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        api.start({ y: 0 });
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setCursor("pointer");
      }}
      onPointerOut={() => {
        setCursor("auto");
        api.start({ y: 0 });
      }}
    >
      {/* recessed well */}
      <RoundedBox args={[1.84, 0.12, 0.72]} radius={0.08} smoothness={6} position={[0, 0.2, 0]} receiveShadow>
        <Plastic color={MAT.bodyDark} repeat={3} clear={0.1} />
      </RoundedBox>
      <animated.group position-y={y}>
        <RoundedBox args={[1.72, 0.32, 0.6]} radius={0.09} smoothness={8} position={[0, 0.33, 0]} castShadow receiveShadow>
          {orange ? (
            <Plastic color={MAT.orange} repeat={3} clear={0.5} normal={0.35} env={0.85} />
          ) : (
            <Plastic color={MAT.keycap} repeat={3} clear={0.26} />
          )}
        </RoundedBox>
        <Label position={[0, 0.5, 0]} size={0.17} color={orange ? "#2a1208" : MAT.ink}>
          {label}
        </Label>
      </animated.group>
    </group>
  );
}

// ---- assembly -----------------------------------------------------------------
const SERVICE_KEYS: { service: Service; label: string; x: number }[] = [
  { service: "id", label: "ID", x: -1.24 },
  { service: "lp", label: "LP", x: 0 },
  { service: "pitchdeck", label: "PITCH DECK", x: 1.24 },
];

export function DeviceModel() {
  const { calcular, reset } = useCalculator();

  return (
    <group>
      <RoundedBox args={[DEV.w, DEV.t, DEV.d]} radius={0.22} smoothness={12} castShadow receiveShadow>
        <Plastic color={MAT.body} repeat={9} clear={0.2} normal={0.6} env={0.65} />
      </RoundedBox>

      <Screen />

      {SERVICE_KEYS.map((k) => (
        <ServiceKey key={k.service} {...k} />
      ))}

      <KnobPanel />

      <BigButton label="ZERAR" x={-0.92} onClick={reset} />
      <BigButton label="CALCULAR" x={0.92} orange onClick={calcular} />
    </group>
  );
}
