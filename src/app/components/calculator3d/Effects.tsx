import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/**
 * Post FX: Bloom makes the LEDs and the calculate-flash glow; a soft vignette
 * focuses the device against the dark backdrop. Normal pass disabled (no SSAO)
 * to keep it cheap on software renderers.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4} disableNormalPass>
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
