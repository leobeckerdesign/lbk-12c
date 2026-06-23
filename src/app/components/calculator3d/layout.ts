// Editable layout for the 3D device. Every block position/size lives here so a
// visual editor (leva sliders + drag gizmos) can drive the geometry live, and
// the chosen values can be baked back as DEFAULT_LAYOUT.

export interface Layout {
  // device shell
  devW: number;
  devD: number;
  devT: number;
  // screen
  scrZ: number;
  scrW: number;
  scrD: number;
  // service keys
  keyZ: number;
  keyW: number;
  keyD: number;
  keySpread: number;
  // knobs
  knobZ: number;
  knobCellW: number;
  knobCellD: number;
  knobSpread: number;
  knobR: number;
  // big buttons
  btnZ: number;
  btnW: number;
  btnD: number;
  btnGap: number;
  // camera
  camFov: number;
  camTilt: number;
  fitMargin: number;
}

export const DEFAULT_LAYOUT: Layout = {
  devW: 4.0,
  devD: 4.95,
  devT: 0.5,
  scrZ: -1.55,
  scrW: 3.7,
  scrD: 1.45,
  keyZ: -0.48,
  keyW: 1.18,
  keyD: 0.5,
  keySpread: 1.25,
  knobZ: 0.55,
  knobCellW: 1.2,
  knobCellD: 1.45,
  knobSpread: 1.27,
  knobR: 0.38,
  btnZ: 1.98,
  btnW: 1.74,
  btnD: 0.74,
  btnGap: 0.05,
  camFov: 13,
  camTilt: 4.5,
  fitMargin: 1.5,
};

const KEY = "lbk-12c-layout-v1";

export function loadLayout(): Layout {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LAYOUT;
    return {
      ...DEFAULT_LAYOUT,
      ...JSON.parse(raw),
      // Camera framing is authored in code for the GLB model, not per-user saved.
      camFov: DEFAULT_LAYOUT.camFov,
      camTilt: DEFAULT_LAYOUT.camTilt,
      fitMargin: DEFAULT_LAYOUT.fitMargin,
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveLayout(l: Layout) {
  try {
    localStorage.setItem(KEY, JSON.stringify(l));
  } catch {
    /* ignore */
  }
}

export function isEditMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has("edit");
  } catch {
    return false;
  }
}
