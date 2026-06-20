// Synthesized tactile feedback for the 3D controls: a short Web Audio click
// (no audio files) plus a haptic pulse on supported devices. The AudioContext
// is created lazily on the first interaction so it satisfies autoplay policy.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Short band-passed noise transient — the "click" body. */
function noise(freq: number, q: number, dur: number, gain: number) {
  const ac = audio();
  if (!ac) return;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filt = ac.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = freq;
  filt.Q.value = q;
  const g = ac.createGain();
  const t = ac.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(filt).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + dur);
}

/** A short tonal "thock" that gives the click a body/pitch. */
function thock(freq: number, dur: number, gain: number) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  const g = ac.createGain();
  const t = ac.currentTime;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function vibrate(ms: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}

export function clickKey() {
  noise(1700, 1.4, 0.05, 0.16);
  thock(230, 0.05, 0.1);
  vibrate(12);
}

export function clickButton() {
  noise(950, 1.1, 0.08, 0.22);
  thock(150, 0.09, 0.16);
  vibrate(22);
}

export function clickKnob() {
  noise(3200, 5, 0.02, 0.12);
  thock(520, 0.025, 0.06);
  vibrate(8);
}
