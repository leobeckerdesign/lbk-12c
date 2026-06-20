import * as THREE from "three";

// ---------------------------------------------------------------------------
// Procedural PBR texture maps (no asset files) for a hyper-real matte plastic.
// One fractal-noise heightfield drives a normal map (fine pebbled grain) and a
// roughness map (micro-spec variation) so the surface catches light unevenly
// like real injection-moulded ABS.
// ---------------------------------------------------------------------------

/** Multi-octave value noise in [0,1]. */
function fractalNoise(size: number, baseGrid: number, octaves: number, persistence: number): Float32Array {
  const out = new Float32Array(size * size);
  let amp = 1;
  let grid = baseGrid;
  let max = 0;

  for (let o = 0; o < octaves; o++) {
    const g = Math.max(2, Math.floor(grid));
    const rnd = new Float32Array(g * g);
    for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * g;
        const gy = (y / size) * g;
        const x0 = Math.floor(gx) % g;
        const y0 = Math.floor(gy) % g;
        const x1 = (x0 + 1) % g;
        const y1 = (y0 + 1) % g;
        let fx = gx - Math.floor(gx);
        let fy = gy - Math.floor(gy);
        fx = fx * fx * (3 - 2 * fx);
        fy = fy * fy * (3 - 2 * fy);
        const v00 = rnd[y0 * g + x0];
        const v10 = rnd[y0 * g + x1];
        const v01 = rnd[y1 * g + x0];
        const v11 = rnd[y1 * g + x1];
        const v = v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
        out[y * size + x] += v * amp;
      }
    }
    max += amp;
    amp *= persistence;
    grid *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
}

const TEX = 512;
let _height: Float32Array | null = null;
function height(): Float32Array {
  if (!_height) _height = fractalNoise(TEX, 24, 5, 0.55);
  return _height;
}

function texFrom(draw: (img: ImageData, h: Float32Array) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = TEX;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(TEX, TEX);
  draw(img, height());
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

let _normal: THREE.CanvasTexture | null = null;
/** Tangent-space normal map derived from the heightfield gradient. */
export function normalTex(): THREE.CanvasTexture {
  if (_normal) return _normal;
  const strength = 2.9;
  _normal = texFrom((img, h) => {
    for (let y = 0; y < TEX; y++) {
      for (let x = 0; x < TEX; x++) {
        const l = h[y * TEX + ((x - 1 + TEX) % TEX)];
        const r = h[y * TEX + ((x + 1) % TEX)];
        const u = h[((y - 1 + TEX) % TEX) * TEX + x];
        const d = h[((y + 1 + TEX) % TEX) * TEX + x];
        let nx = (l - r) * strength;
        let ny = (u - d) * strength;
        let nz = 1;
        const inv = 1 / Math.hypot(nx, ny, nz);
        nx *= inv;
        ny *= inv;
        nz *= inv;
        const i = (y * TEX + x) * 4;
        img.data[i] = (nx * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
        img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
  });
  return _normal;
}

let _rough: THREE.CanvasTexture | null = null;
/** Roughness variation map (grayscale) for micro-spec breakup. */
export function roughTex(): THREE.CanvasTexture {
  if (_rough) return _rough;
  _rough = texFrom((img, h) => {
    for (let i = 0; i < h.length; i++) {
      const v = Math.max(0, Math.min(255, (0.62 + h[i] * 0.34) * 255));
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
  });
  return _rough;
}

/** Set the tiling for a material's maps without mutating the shared singletons. */
function tiled(tex: THREE.CanvasTexture, repeat: number): THREE.Texture {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}

const _surf = new Map<number, { normalMap: THREE.Texture; roughnessMap: THREE.Texture }>();
/** Cached {normalMap, roughnessMap} pair at a given tiling (one clone per repeat). */
export function surface(repeat: number) {
  let s = _surf.get(repeat);
  if (!s) {
    s = { normalMap: tiled(normalTex(), repeat), roughnessMap: tiled(roughTex(), repeat) };
    _surf.set(repeat, s);
  }
  return s;
}

/** Material palette for the device (hex -> consumed by meshPhysicalMaterial). */
export const MAT = {
  bodyLight: "#d8ccab",
  body: "#ccbf9d",
  bodyDark: "#b3a684",
  keycap: "#cabd9b",
  knob: "#0e3a33",
  knobDark: "#0a2c27",
  orange: "#e8632a",
  orangeHot: "#f0673a",
  screen: "#0c241f",
  ink: "#0c352f",
  led: "#f0673a",
} as const;
