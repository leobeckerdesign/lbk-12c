# LBK-12C — Integração do modelo 3D (GLB)

Modelo modelado no Blender a partir dos vetores do Figma (`VETORES/01.svg` estrutura + `02.svg` tipografia).
Substitui a geometria procedural de `calculator3d/DeviceModel.tsx`.

- **Asset:** `public/models/lbk12c.glb` (~2.8 MB, ~56k tris)
- **Backup editável:** `Desktop/LBK-12C/lbk12c_model.blend`
- **Escala:** metros reais (device ~0.175 × 0.217 m). Escale no R3F pra caber na câmera.
- **Eixo:** export `+Y up` (glTF). A face do device aponta **+Y**. Knobs giram em torno do **Y local**.
- **Materiais:** PBR nativos (base color + roughness + normal map de grão tiling). `LED_Orange_On` é **emissive**.

## Carregando

```tsx
import { useGLTF } from "@react-three/drei";
useGLTF.preload("/models/lbk12c.glb");

const { nodes, materials } = useGLTF("/models/lbk12c.glb");
// cada peça é um nó nomeado: nodes.Housing, nodes.Knob_EXP, nodes.Btn_CALCULAR, ...
```

## Mapa de nós → papel (dirigido pelo CalculatorContext)

| Nó(s) | Papel | Estado (CalculatorContext) |
|---|---|---|
| `Housing`, `RecessPanel`, `KnobCell_EXP/CLI/OPP` | corpo / casca estática | — |
| `Screen` | vidro da tela (superfície) | conteúdo é overlay R3F → ver `ScreenReadout` |
| `Btn_ID` / `Btn_LP` / `Btn_PITCH` | tecla de serviço (press) | `onClick → toggleService('id'|'lp'|'pitchdeck')` |
| `LEDBar_ID` / `LEDBar_LP` / `LEDBar_PITCH` | LED largo de seleção (on/off) | aceso quando `isActive(service)` |
| `Knob_EXP` / `Knob_CLI` / `Knob_OPP` | knob rotativo | gira p/ `expPos`/`clientPos`/`oppPos` (0/1/2); `onClick → cycleExp/cycleClient/cycleOpp` |
| `KnobInd_*`, `KnobPill_*`, `KnobLine_*` | indicadores do knob | **parenteados ao knob** → giram junto, não mexer |
| `LED_*_L` / `LED_*_T` / `LED_*_R` | 3 LEDs redondos por knob | aceso = posição atual (0→`_L`, 1→`_T`, 2→`_R`) |
| `Btn_ZERAR` | tecla ZERAR (press) | `onClick → reset()` |
| `Btn_CALCULAR` | tecla CALCULAR (press) | `onClick → calcular()` + flash da tela |
| `Labels_Surface` | textos gravados (relevo) | estático |

## Convenções de animação

- **Pivôs já vêm prontos no GLB:**
  - Knobs: origem no **centro** → rotacionar `rotation.y`.
  - Botões: origem na **base** → press = `position.y -= curso` (com mola, ex. `@react-spring/three`).
- **Knob → posição:** mapeie `pos` (0|1|2) a um ângulo, ex. `[-Math.PI/5, 0, Math.PI/5][pos]` em `rotation.y` (ajuste o sinal/àngulo no olho). Os indicadores acompanham (parenteados).
- **LED on/off:** troque o material por `materials.LED_Orange_On` (aceso) vs `LED_Green_Off` (redondos) / `LEDBar_Off` (barras), **ou** controle `emissiveIntensity` no material clonado por LED.

```tsx
// exemplo: knob de experiência
const { expPos, cycleExp } = useCalculator();
const angle = [-Math.PI/5, 0, Math.PI/5][expPos];
const { rotation } = useSpring({ rotation: [0, angle, 0] });
<a.primitive object={nodes.Knob_EXP} rotation={rotation} onClick={cycleExp} />

// LED redondo aceso conforme a posição
['L','T','R'].forEach((slot, i) =>
  nodes[`LED_EXP_${slot}`].material = i === expPos ? materials.LED_Orange_On : materials.LED_Green_Off
);
```

## Fica no R3F (não está no GLB, de propósito)

- **Conteúdo da tela** — número/resultado, `LBK-12C`, linha `PLENO / MÉDIO / MÉDIA`, dígito `0`, logo LBK, ícone ⓘ → overlay dinâmico (`ScreenReadout` via `<Html transform>` no plano do `Screen`).
- **Flash da tela** no CALCULAR (`flash` state) — pulso de emissive/overlay sobre o `Screen`.
- **Som + vibração** (`useClickFeedback`) — manter nos handlers de clique.

## Estados-default no modelo (cosmético — o R3F sobrescreve)

No GLB vem: `ID` aceso, knobs centrados com `LED_*_T` aceso. Em runtime, dirigir tudo pelo estado.
