import { Environment, Lightformer, ContactShadows } from "@react-three/drei";

/**
 * Soft top-down studio lighting that matches the reference render:
 * a key light from above-front, gentle fill, a procedural Lightformer
 * environment for PBR reflections (no HDRI download), and a contact
 * shadow under the device so it sits on the surface.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[2.5, 9, 4]}
        intensity={1.45}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 0.1, 30]} />
      </directionalLight>

      <Environment resolution={256} frames={1}>
        <Lightformer intensity={0.95} position={[0, 6, 3]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.55} position={[-5, 4, 4]} scale={[5, 8, 1]} />
        <Lightformer intensity={0.5} position={[5, 4, -2]} scale={[5, 8, 1]} />
        <Lightformer intensity={0.35} position={[0, 3, -6]} scale={[10, 5, 1]} />
      </Environment>

      <ContactShadows
        position={[0, -0.3, 0.1]}
        opacity={0.6}
        scale={11}
        blur={2.6}
        far={2.5}
        resolution={1024}
        color="#04100c"
      />
    </>
  );
}
