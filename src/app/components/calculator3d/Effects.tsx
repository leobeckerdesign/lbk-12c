import { EffectComposer, Bloom, Vignette, N8AO } from "@react-three/postprocessing";

/**
 * Post FX:
 * - N8AO: high-quality ambient occlusion — the crevice darkening (around knobs,
 *   in the recesses, button gaps) that gives the device real depth. Biggest
 *   realism lever vs a flat real-time look.
 * - Bloom: LEDs / calculate-flash glow.
 * - Vignette: focuses the device against the dark backdrop.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <N8AO
        halfRes
        aoRadius={0.7}
        distanceFalloff={1.0}
        intensity={3.2}
        color="#02100b"
        quality="medium"
      />
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.92}
        luminanceSmoothing={0.18}
        mipmapBlur
        radius={0.55}
      />
      <Vignette offset={0.32} darkness={0.55} eskil={false} />
    </EffectComposer>
  );
}
