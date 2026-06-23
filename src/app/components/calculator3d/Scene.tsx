import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { TransformControls, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Lighting } from "./Lighting";
import { DeviceGLB } from "./DeviceGLB";
import { CalculatorProvider } from "./CalculatorContext";
import { Effects } from "./Effects";
import type { Layout } from "./layout";

/** Responsive fit: position the camera so the whole device fills any viewport. */
function FitCamera({ L }: { L: Layout }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = L.camFov;
    const fov = (L.camFov * Math.PI) / 180;
    const aspect = size.width / size.height;
    const distD = (L.devD * L.fitMargin) / 2 / Math.tan(fov / 2);
    const distW = (L.devW * L.fitMargin) / 2 / (Math.tan(fov / 2) * aspect);
    const dist = Math.max(distD, distW);
    const dir = new THREE.Vector3(0, 1, 0); // straight above = 100% front for the face-up device
    cam.position.copy(dir.multiplyScalar(dist));
    cam.up.set(0, 0, -1); // screen edge points to the top of the frame
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size, L.camFov, L.camTilt, L.fitMargin, L.devW, L.devD]);
  return null;
}

/**
 * Right-mouse-button drag rotates the device to inspect any side. Left button
 * stays free for the knob/button interactions. Releasing springs the device
 * back to 100% front (its resting pose).
 */
function RotateGroup({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, z: 0 });
  const drag = useRef({ on: false, x: 0, y: 0 });
  const zoom = useRef(1); // scroll zoom: 1 = fit (max), 0.5 = half (min)
  const { gl } = useThree();

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (e.button !== 2) return; // right button only
      drag.current = { on: true, x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.on) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      target.current.z = THREE.MathUtils.clamp(target.current.z - dx * 0.01, -1.5, 1.5);
      target.current.x = THREE.MathUtils.clamp(target.current.x + dy * 0.01, -1.5, 1.5);
    };
    const up = () => {
      if (!drag.current.on) return;
      drag.current.on = false;
      target.current = { x: 0, z: 0 }; // spring back to 100% front at rest
    };
    const ctx = (e: Event) => e.preventDefault(); // no browser menu on right-click
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); // scroll zooms the object instead of the page
      zoom.current = THREE.MathUtils.clamp(zoom.current - e.deltaY * 0.0009, 0.5, 1);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("contextmenu", ctx);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("contextmenu", ctx);
    };
  }, [gl, enabled]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, target.current.x, 0.12);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, target.current.z, 0.12);
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, zoom.current, 0.18));
  });

  return <group ref={ref}>{children}</group>;
}

/** Draggable Z handle (gizmo) wired to a layout key. */
function DragZ({
  y,
  z,
  color,
  onChange,
}: {
  y: number;
  z: number;
  color: string;
  onChange: (z: number) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  return (
    <TransformControls
      mode="translate"
      showX={false}
      showY={false}
      size={0.55}
      onObjectChange={() => {
        if (ref.current) onChange(Math.round(ref.current.position.z * 100) / 100);
      }}
    >
      <mesh ref={ref} position={[0, y, z]}>
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </TransformControls>
  );
}

/** Edit-mode drag handles for the block Z positions. */
function Editor({ L, set }: { L: Layout; set: (p: Partial<Layout>) => void }) {
  const y = L.devT / 2 + 0.7;
  return (
    <group>
      <DragZ y={y} z={L.scrZ} color="#39d3ff" onChange={(z) => set({ scrZ: z })} />
      <DragZ y={y} z={L.keyZ} color="#ffd23a" onChange={(z) => set({ keyZ: z })} />
      <DragZ y={y} z={L.knobZ} color="#7cff6b" onChange={(z) => set({ knobZ: z })} />
      <DragZ y={y} z={L.btnZ} color="#ff7a3a" onChange={(z) => set({ btnZ: z })} />
    </group>
  );
}

/** Screen-space vertical gradient backdrop — dark top → teal bottom (exact reference tones). */
function GradientBackground() {
  const { scene } = useThree();
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 512;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.0, "#00100e"); // top (darkest)
    g.addColorStop(0.25, "#00100f");
    g.addColorStop(0.5, "#011c19");
    g.addColorStop(0.75, "#002d29");
    g.addColorStop(1.0, "#003f39"); // bottom (teal)
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true; // default flipY (true) → canvas top = screen top (dark on top)
    const prev = scene.background;
    scene.background = tex;
    return () => {
      scene.background = prev;
      tex.dispose();
    };
  }, [scene]);
  return null;
}

export function Scene({
  layout,
  set,
  edit,
}: {
  layout: Layout;
  set: (p: Partial<Layout>) => void;
  edit: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 25, 4.5], fov: layout.camFov, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <GradientBackground />
      {!edit && <FitCamera L={layout} />}
      {edit && (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={80}
          target={[0, 0, 0]}
        />
      )}
      <Lighting />
      <CalculatorProvider>
        <RotateGroup enabled={!edit}>
          <Suspense fallback={null}>
            <DeviceGLB targetWidth={layout.devW} />
          </Suspense>
        </RotateGroup>
      </CalculatorProvider>
      {edit && <Editor L={layout} set={set} />}
      <Effects />
    </Canvas>
  );
}
