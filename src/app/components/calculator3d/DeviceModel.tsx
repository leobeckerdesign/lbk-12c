import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox, Cylinder, Text } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import type { ThreeEvent } from "@react-three/fiber";
import { surface, MAT } from "./materials";
import { useCalculator } from "./CalculatorContext";
import { clickKey, clickButton, clickKnob } from "./useClickFeedback";
import type { Service } from "../calculator/pricing";
import type { Layout } from "./layout";

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

function Led({ position, on, r = 0.045 }: { position: [number, number, number]; on: boolean; r?: number }) {
  return (
    <Cylinder args={[r, r, 0.03, 20]} position={position}>
      <meshStandardMaterial
        color={on ? MAT.led : "#0c2b26"}
        emissive={on ? MAT.led : "#000000"}
        emissiveIntensity={on ? 2.6 : 0}
        roughness={0.5}
      />
    </Cylinder>
  );
}

// ---- screen -------------------------------------------------------------------
function Screen({ L, face }: { L: Layout; face: number }) {
  const { flash } = useCalculator();
  const { glow } = useSpring({ glow: flash ? 0.4 : 0, config: { tension: 220, friction: 16 } });
  const top = face + 0.04;
  return (
    <group>
      <RoundedBox args={[L.scrW + 0.28, 0.22, L.scrD + 0.28]} radius={0.1} smoothness={8} position={[0, face + 0.02, L.scrZ]} castShadow receiveShadow>
        <Plastic color={MAT.bodyDark} repeat={5} clear={0.14} />
      </RoundedBox>
      <RoundedBox args={[L.scrW, 0.18, L.scrD]} radius={0.045} smoothness={8} position={[0, top - 0.04, L.scrZ]} receiveShadow>
        <animated.meshPhysicalMaterial
          color="#08201b"
          emissive={MAT.orange}
          emissiveIntensity={glow}
          roughness={0.45}
          metalness={0}
          clearcoat={0.35}
          clearcoatRoughness={0.32}
          envMapIntensity={0.3}
        />
      </RoundedBox>
    </group>
  );
}

// ---- service key --------------------------------------------------------------
function ServiceKey({ service, label, x, L, face }: { service: Service; label: string; x: number; L: Layout; face: number }) {
  const { isActive, toggleService } = useCalculator();
  const active = isActive(service);
  const [{ y }, api] = useSpring(() => ({ y: 0, config: { tension: 700, friction: 22 } }));

  return (
    <group
      position={[x, 0, L.keyZ]}
      onPointerDown={(e) => {
        e.stopPropagation();
        clickKey();
        api.start({ y: -0.06 });
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        api.start({ y: 0 });
        toggleService(service);
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
      <RoundedBox args={[L.keyW + 0.06, 0.12, L.keyD + 0.06]} radius={0.05} smoothness={6} position={[0, face - 0.04, 0]} receiveShadow>
        <Plastic color={MAT.bodyDark} repeat={3} clear={0.1} />
      </RoundedBox>
      <animated.group position-y={y}>
        <RoundedBox args={[L.keyW, 0.26, L.keyD]} radius={0.07} smoothness={8} position={[0, face + 0.07, 0]} castShadow receiveShadow>
          <Plastic color={MAT.keycap} repeat={3} clear={0.26} />
        </RoundedBox>
        <RoundedBox args={[L.keyW * 0.7, 0.09, 0.1]} radius={0.03} smoothness={4} position={[0, face + 0.16, L.keyD * 0.22]}>
          <meshStandardMaterial
            color={active ? MAT.led : "#39342a"}
            emissive={active ? MAT.led : "#000000"}
            emissiveIntensity={active ? 2.3 : 0}
            roughness={0.6}
          />
        </RoundedBox>
        <Label position={[0, face + 0.21, -L.keyD * 0.16]} size={0.1}>
          {label}
        </Label>
      </animated.group>
    </group>
  );
}

// ---- knob cell ----------------------------------------------------------------
function KnobCell({
  label,
  value,
  x,
  pos,
  onCycle,
  L,
  face,
}: {
  label: string;
  value: string;
  x: number;
  pos: 0 | 1 | 2;
  onCycle: () => void;
  L: Layout;
  face: number;
}) {
  const r = L.knobR;
  const cw = L.knobCellW;
  const cd = L.knobCellD;
  const profile = useMemo(
    () =>
      [
        [r, 0.0],
        [r, 0.3],
        [r * 0.97, 0.35],
        [r * 0.88, 0.4],
        [r * 0.72, 0.44],
        [r * 0.42, 0.465],
        [0, 0.475],
      ].map(([px, py]) => new THREE.Vector2(px, py)),
    [r],
  );

  const targetRot = pos === 0 ? 0.84 : pos === 2 ? -0.84 : 0;
  const { rot } = useSpring({ rot: targetRot, config: { tension: 320, friction: 17 } });
  const [{ s }, api] = useSpring(() => ({ s: 1, config: { tension: 700, friction: 20 } }));

  const knobZ = cd * 0.06;
  const ledY = face + 0.13;
  const ledZ = knobZ - r - 0.16;

  return (
    <group position={[x, 0, L.knobZ]}>
      {/* raised cell panel */}
      <RoundedBox args={[cw, 0.16, cd]} radius={0.08} smoothness={8} position={[0, face + 0.03, 0]} castShadow receiveShadow>
        <Plastic color={MAT.keycap} repeat={4} clear={0.18} />
      </RoundedBox>

      <Label position={[0, face + 0.13, -cd * 0.36]} size={0.1}>
        {label}
      </Label>

      <Led position={[-cw * 0.34, ledY, ledZ + 0.12]} on={pos === 0} />
      <Led position={[0, ledY, ledZ]} on={pos === 1} />
      <Led position={[cw * 0.34, ledY, ledZ + 0.12]} on={pos === 2} />

      <animated.group
        position={[0, 0, knobZ]}
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
        <mesh position={[0, face + 0.05, 0]} castShadow receiveShadow>
          <latheGeometry args={[profile, 64]} />
          <meshPhysicalMaterial
            color={MAT.knob}
            roughness={0.36}
            metalness={0}
            clearcoat={0.7}
            clearcoatRoughness={0.28}
            envMapIntensity={1}
            normalMap={surface(7).normalMap}
            normalScale={new THREE.Vector2(0.16, 0.16)}
          />
        </mesh>
        <RoundedBox args={[0.04, 0.05, r * 0.5]} radius={0.015} smoothness={3} position={[0, face + 0.52, -r * 0.4]}>
          <meshStandardMaterial color={MAT.keycap} roughness={0.5} />
        </RoundedBox>
      </animated.group>

      <Label position={[0, face + 0.13, cd * 0.4]} size={0.1}>
        {value}
      </Label>
    </group>
  );
}

// ---- big button ---------------------------------------------------------------
function BigButton({
  label,
  x,
  orange,
  onClick,
  L,
  face,
}: {
  label: string;
  x: number;
  orange?: boolean;
  onClick: () => void;
  L: Layout;
  face: number;
}) {
  const [{ y }, api] = useSpring(() => ({ y: 0, config: { tension: 600, friction: 20 } }));
  return (
    <group
      position={[x, 0, L.btnZ]}
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
      <RoundedBox args={[L.btnW + 0.08, 0.12, L.btnD + 0.08]} radius={0.07} smoothness={6} position={[0, face - 0.04, 0]} receiveShadow>
        <Plastic color={MAT.bodyDark} repeat={3} clear={0.1} />
      </RoundedBox>
      <animated.group position-y={y}>
        <RoundedBox args={[L.btnW, 0.32, L.btnD]} radius={0.09} smoothness={8} position={[0, face + 0.1, 0]} castShadow receiveShadow>
          {orange ? (
            <Plastic color={MAT.orange} repeat={3} clear={0.5} normal={0.35} env={0.85} />
          ) : (
            <Plastic color={MAT.keycap} repeat={3} clear={0.26} />
          )}
        </RoundedBox>
        <Label position={[0, face + 0.27, 0]} size={0.17} color={orange ? "#2a1208" : MAT.ink}>
          {label}
        </Label>
      </animated.group>
    </group>
  );
}

// ---- assembly -----------------------------------------------------------------
const SERVICES: { service: Service; label: string }[] = [
  { service: "id", label: "ID" },
  { service: "lp", label: "LP" },
  { service: "pitchdeck", label: "PITCH DECK" },
];

export function DeviceModel({ layout: L }: { layout: Layout }) {
  const c = useCalculator();
  const face = L.devT / 2;
  const btnX = L.btnW / 2 + L.btnGap / 2;

  const knobs = [
    { label: "EXPERIÊNCIA", value: c.experienceLabel, pos: c.expPos, onCycle: c.cycleExp },
    { label: "CLIENTE", value: c.clientLabel, pos: c.clientPos, onCycle: c.cycleClient },
    { label: "OPORTUNIDADE", value: c.opportunityLabel, pos: c.oppPos, onCycle: c.cycleOpp },
  ] as const;

  return (
    <group>
      <RoundedBox args={[L.devW, L.devT, L.devD]} radius={0.22} smoothness={12} castShadow receiveShadow>
        <Plastic color={MAT.body} repeat={9} clear={0.2} normal={0.6} env={0.65} />
      </RoundedBox>

      <Screen L={L} face={face} />

      {SERVICES.map((k, i) => (
        <ServiceKey key={k.service} {...k} x={(i - 1) * L.keySpread} L={L} face={face} />
      ))}

      {knobs.map((k, i) => (
        <KnobCell key={k.label} {...k} x={(i - 1) * L.knobSpread} L={L} face={face} />
      ))}

      <BigButton label="ZERAR" x={-btnX} onClick={c.reset} L={L} face={face} />
      <BigButton label="CALCULAR" x={btnX} orange onClick={c.calcular} L={L} face={face} />
    </group>
  );
}
