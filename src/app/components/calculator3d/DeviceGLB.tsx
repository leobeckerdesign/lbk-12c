import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useCalculator } from "./CalculatorContext";
import { clickKey, clickButton, clickKnob } from "./useClickFeedback";
import { ScreenReadout } from "./ScreenReadout";
import { surface } from "./materials";

const URL = "/models/lbk12c.glb";
useGLTF.preload(URL);

// Knob rotation per position (0|1|2). Tune sign/amount to taste.
const KNOB_ANGLES = [0.72, 0, -0.72];
// Button press depth, in GLB units (meters) — scaled with the group.
const PRESS_DEPTH = -0.0022;

const BTN_NAMES = ["Btn_ID", "Btn_LP", "Btn_PITCH", "Btn_ZERAR", "Btn_CALCULAR"];
const KNOB_NAMES = ["Knob_EXP", "Knob_CLI", "Knob_OPP"];

function setCursor(v: "pointer" | "auto") {
  document.body.style.cursor = v;
}

/** Walk up the parent chain to find the first ancestor whose name is in `names`. */
function namedAncestor(obj: THREE.Object3D, names: string[]): string | null {
  let o: THREE.Object3D | null = obj;
  while (o) {
    if (names.includes(o.name)) return o.name;
    o = o.parent;
  }
  return null;
}

export function DeviceGLB({ targetWidth = 4.0 }: { targetWidth?: number }) {
  const c = useCalculator();
  const { scene, materials } = useGLTF(URL) as unknown as {
    scene: THREE.Group;
    materials: Record<string, THREE.Material>;
  };

  // Clone so we can mutate transforms/materials without touching the cache.
  const model = useMemo(() => scene.clone(true), [scene]);

  // Realism: richer matte-plastic surface (fine grain normal + roughness
  // variation) and tuned env reflections on the GLB materials.
  useMemo(() => {
    const grain = (
      name: string,
      opts: { repeat?: number; normal?: number; rough?: number; env?: number },
    ) => {
      const m = materials[name] as THREE.MeshStandardMaterial | undefined;
      if (!m) return;
      const s = surface(opts.repeat ?? 1);
      m.normalMap = s.normalMap;
      m.normalScale = new THREE.Vector2(opts.normal ?? 0.45, opts.normal ?? 0.45);
      m.roughnessMap = s.roughnessMap;
      if (opts.rough != null) m.roughness = opts.rough;
      m.envMapIntensity = opts.env ?? 0.9;
      m.needsUpdate = true;
    };
    // env kept moderate so plastic stays matte on real GPUs (SwiftShader hides
    // reflections in the headless preview, so be conservative here).
    grain("Plastic_Cream", { repeat: 1, normal: 0.5, env: 0.55 });
    grain("Plastic_Teal", { repeat: 1, normal: 0.32, rough: 0.34, env: 0.7 });
    grain("Plastic_Orange", { repeat: 1, normal: 0.4, env: 0.6 });
    grain("Cream_Line", { repeat: 1, normal: 0.3, env: 0.5 });
    // dark display glass: low env + mid roughness so it never turns into a mirror
    const sc = materials.Glass_Screen as THREE.MeshStandardMaterial | undefined;
    if (sc) {
      sc.roughness = 0.32;
      sc.envMapIntensity = 0.4;
      sc.needsUpdate = true;
    }
  }, [materials]);

  // Center at origin + uniform scale to match the scene units.
  const { center, scale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const c0 = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    return { center: c0, scale: targetWidth / (size.x || 1) };
  }, [model, targetWidth]);

  // Screen overlay transform (computed from the GLB "Screen" node).
  const screenXf = useMemo(() => {
    const s = model.getObjectByName("Screen");
    if (!s) return null;
    const box = new THREE.Box3().setFromObject(s);
    const ctr = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    return {
      position: [ctr.x - center.x, box.max.y - center.y + 0.0006, ctr.z - center.z] as [
        number,
        number,
        number,
      ],
      width: size.x,
      depth: size.z,
    };
  }, [model, center]);

  // Interactive node refs.
  const knobs = useMemo(
    () => ({
      exp: model.getObjectByName("Knob_EXP"),
      cli: model.getObjectByName("Knob_CLI"),
      opp: model.getObjectByName("Knob_OPP"),
    }),
    [model],
  );

  // Rest Y of each button (for the press offset).
  const rest = useMemo(() => {
    const m = new Map<THREE.Object3D, number>();
    BTN_NAMES.forEach((n) => {
      const o = model.getObjectByName(n);
      if (o) m.set(o, o.position.y);
    });
    return m;
  }, [model]);

  const pressed = useRef<Record<string, boolean>>({});

  // Drive LED materials from state (round LEDs per knob + service bars).
  useEffect(() => {
    const swap = (name: string, on: boolean, offMat: THREE.Material) => {
      const o = model.getObjectByName(name) as THREE.Mesh | null;
      if (o) o.material = on ? materials.LED_Orange_On : offMat;
    };
    const pos = { EXP: c.expPos, CLI: c.clientPos, OPP: c.oppPos } as const;
    (Object.keys(pos) as Array<keyof typeof pos>).forEach((k) => {
      const p = pos[k];
      swap(`LED_${k}_L`, p === 0, materials.LED_Green_Off);
      swap(`LED_${k}_T`, p === 1, materials.LED_Green_Off);
      swap(`LED_${k}_R`, p === 2, materials.LED_Green_Off);
    });
    swap("LEDBar_ID", c.services.includes("id"), materials.LEDBar_Off);
    swap("LEDBar_LP", c.services.includes("lp"), materials.LEDBar_Off);
    swap("LEDBar_PITCH", c.services.includes("pitchdeck"), materials.LEDBar_Off);
  }, [model, materials, c.expPos, c.clientPos, c.oppPos, c.services]);

  // Animate knob rotation + button press each frame.
  useFrame(() => {
    const L = THREE.MathUtils.lerp;
    const map: Array<[THREE.Object3D | null | undefined, number]> = [
      [knobs.exp, KNOB_ANGLES[c.expPos]],
      [knobs.cli, KNOB_ANGLES[c.clientPos]],
      [knobs.opp, KNOB_ANGLES[c.oppPos]],
    ];
    map.forEach(([o, target]) => {
      if (o) o.rotation.y = L(o.rotation.y, target, 0.22);
    });
    rest.forEach((restY, o) => {
      const target = pressed.current[o.name] ? restY + PRESS_DEPTH : restY;
      o.position.y = L(o.position.y, target, 0.4);
    });
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return; // left button only — right drag rotates the device
    const b = namedAncestor(e.object, BTN_NAMES);
    if (b) {
      e.stopPropagation();
      pressed.current[b] = true;
      if (b === "Btn_ZERAR" || b === "Btn_CALCULAR") clickButton();
      else clickKey();
      return;
    }
    const k = namedAncestor(e.object, KNOB_NAMES);
    if (k) {
      e.stopPropagation();
      clickKnob();
      if (k === "Knob_EXP") c.cycleExp();
      else if (k === "Knob_CLI") c.cycleClient();
      else c.cycleOpp();
    }
  };

  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return; // left button only
    const b = namedAncestor(e.object, BTN_NAMES);
    if (!b) return;
    e.stopPropagation();
    pressed.current[b] = false;
    if (b === "Btn_ID") c.toggleService("id");
    else if (b === "Btn_LP") c.toggleService("lp");
    else if (b === "Btn_PITCH") c.toggleService("pitchdeck");
    else if (b === "Btn_ZERAR") c.reset();
    else if (b === "Btn_CALCULAR") c.calcular();
  };

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (namedAncestor(e.object, BTN_NAMES) || namedAncestor(e.object, KNOB_NAMES)) {
      e.stopPropagation();
      setCursor("pointer");
    }
  };

  const onOut = () => {
    setCursor("auto");
    pressed.current = {};
  };

  return (
    <group scale={scale}>
      <primitive
        object={model}
        position={[-center.x, -center.y, -center.z]}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerOver={onOver}
        onPointerOut={onOut}
      />
      {screenXf && (
        <ScreenReadout
          position={screenXf.position}
          rotation={[-Math.PI / 2, 0, 0]}
          worldWidth={screenXf.width}
        />
      )}
    </group>
  );
}

useGLTF.preload(URL);
