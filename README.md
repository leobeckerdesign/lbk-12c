# LBK-12C — Freelancer Pricing Calculator

A pricing tool for freelance designers, built as a photoreal **3D device you actually operate** — turn the knobs, punch the service buttons, and watch the dot-matrix display roll to a price. Pricing is calibrated to the Brazilian design market.

**Live:** https://lbk-12c.leobecker.com

## What it does

Pick a service (**ID** · **Landing Page** · **Pitch Deck**), then dial in the client size, your seniority level, and how much you want the job. The device computes a market-calibrated price and can explain the methodology behind it.

## Stack

- **Vite 6** + **React 18** + **TypeScript**
- **React Three Fiber** (three.js) for the 3D device — with `drei`, `postprocessing` and `react-spring`
- 3D model authored in **Blender**, shipped as a single GLB (`public/models/lbk12c.glb`)
- **Tailwind CSS v4**
- A CSS-only **2D fallback** renders automatically when WebGL isn't available

## Run

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

Append `?edit=1` to the URL to open the live layout editor (sliders + gizmos + orbit).

## Build

```bash
pnpm build      # static output in dist/
```

## Deploy

Containerized with a multi-stage **Dockerfile** (Node build → **nginx** serving the static bundle). See `Dockerfile` and `nginx.conf`. The GLB model integration is documented in `MODEL_INTEGRATION.md`.

---

© Leo Becker Media House
