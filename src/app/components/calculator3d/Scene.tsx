import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Lighting } from "./Lighting";
import { DeviceModel } from "./DeviceModel";
import { ScreenReadout } from "./ScreenReadout";
import { CalculatorProvider } from "./CalculatorContext";
import { Effects } from "./Effects";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Subtle parallax: the device leans toward the cursor for a sense of depth. */
function TiltGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const tx = reduced ? 0 : state.pointer.y * 0.1;
    const tz = reduced ? 0 : -state.pointer.x * 0.1;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, tx, 0.05);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, tz, 0.05);
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * WebGL presentation layer for the LBK-12C. Near-top-down camera with a slight
 * tilt to read the device's volume, matching the reference render's framing.
 */
export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 25, 4.5], fov: 13, near: 0.1, far: 100 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={["#16211d"]} />
      <Lighting />
      <CalculatorProvider>
        <TiltGroup>
          <DeviceModel />
          <ScreenReadout />
        </TiltGroup>
      </CalculatorProvider>
      <Effects />
    </Canvas>
  );
}
