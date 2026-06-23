import { useEffect, useRef } from "react";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import * as THREE from "three";

// Required once so RectAreaLight (the soft-boxes) render correctly.
RectAreaLightUniformsLib.init();

/**
 * Soft two-light studio, like the reference render:
 * - KEY: big warm soft-box from the upper-LEFT (lateral, gives form + gradient).
 * - FILL: cooler, weaker soft-box from the opposite side (right) to open up the
 *   shadow side so nothing goes harsh/black — the soft look.
 * Depth from the key/fill gradient + N8AO + contact shadow.
 */
export function Lighting() {
  const key = useRef<THREE.RectAreaLight>(null);
  const fill = useRef<THREE.RectAreaLight>(null);
  useEffect(() => {
    key.current?.lookAt(0, 0, 0);
    fill.current?.lookAt(0, 0, 0);
  }, []);

  return (
    <>
      {/* KEY — upper-left, warm */}
      <rectAreaLight
        ref={key}
        position={[-12, 8, -3]}
        width={26}
        height={18}
        intensity={2.6}
        color="#fff4e6"
      />

      {/* FILL — opposite side (right), cooler + softer, ~half the key */}
      <rectAreaLight
        ref={fill}
        position={[12, 5, 5]}
        width={24}
        height={16}
        intensity={1.25}
        color="#e9f1ff"
      />
    </>
  );
}
