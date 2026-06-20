import { useMemo, useState } from "react";
import { COLORS } from "./tokens";
import { Display } from "./Display";
import { ServiceKey, Knob, BigKey } from "./Controls";
import {
  calculatePrice,
  type PricingResult,
  CUSTO_START,
  SERVICE_LABELS,
  EXPERIENCE_LABELS,
  CLIENT_LABELS,
  OPPORTUNITY_LABELS,
  type Service,
  type Experience,
  type ClientSize,
  type Opportunity,
} from "./pricing";

type Pos = 0 | 1 | 2;

const SERVICE_ORDER: Service[] = ["id", "lp", "pitchdeck"];
const EXPERIENCE_BY_POS: Experience[] = ["junior", "pleno", "senior"];
const CLIENT_BY_POS: ClientSize[] = ["pequeno", "medio", "grande"];
const OPPORTUNITY_BY_POS: Opportunity[] = ["pouca", "media", "alta"];

export function Device() {
  const [services, setServices] = useState<Service[]>([]);
  // CUSTO has no on-device control anymore; it stays at the default just to
  // power the hours-equivalent readout.
  const custo = CUSTO_START;
  const [expPos, setExpPos] = useState<Pos>(1);
  const [clientPos, setClientPos] = useState<Pos>(1);
  const [oppPos, setOppPos] = useState<Pos>(1);
  const [flash, setFlash] = useState(false);
  // The total is only revealed after pressing CALCULAR; null = waiting for a calc.
  const [calcResult, setCalcResult] = useState<PricingResult | null>(null);

  const experience = EXPERIENCE_BY_POS[expPos];
  const client = CLIENT_BY_POS[clientPos];
  const opportunity = OPPORTUNITY_BY_POS[oppPos];

  const result = useMemo(
    () => calculatePrice({ services, client, experience, opportunity, custo }),
    [services, client, experience, opportunity, custo],
  );

  const toggleService = (s: Service) =>
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const reset = () => {
    setServices([]);
    setExpPos(1);
    setClientPos(1);
    setOppPos(1);
    setCalcResult(null);
  };

  const calcular = () => {
    setCalcResult(result);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 320);
  };

  const servicesLine = SERVICE_ORDER.filter((s) => services.includes(s))
    .map((s) => SERVICE_LABELS[s])
    .join("+");

  const selectorsLine = `${EXPERIENCE_LABELS[experience]} / ${CLIENT_LABELS[client]} / ${OPPORTUNITY_LABELS[opportunity]}`;

  return (
    <div
      className="relative flex flex-col"
      style={{
        width: 560,
        gap: 14,
        padding: 22,
        borderRadius: 26,
        background: `linear-gradient(160deg, ${COLORS.bodyLight} 0%, ${COLORS.bodyMid} 45%, ${COLORS.bodyDark} 100%)`,
        boxShadow:
          "inset 4px 4px 6px rgba(255,255,255,0.6), inset -5px -6px 8px rgba(0,0,0,0.22), 0 30px 60px rgba(0,0,0,0.55), 0 8px 16px rgba(0,0,0,0.4)",
      }}
    >
      <Display
        servicesLine={servicesLine}
        selectorsLine={selectorsLine}
        projectPrice={calcResult?.projectPrice ?? 0}
        show={calcResult !== null && services.length > 0}
        flash={flash}
      />

      {/* services */}
      <div className="grid grid-cols-3 gap-2.5">
        {SERVICE_ORDER.map((s) => (
          <ServiceKey
            key={s}
            label={SERVICE_LABELS[s]}
            active={services.includes(s)}
            onToggle={() => toggleService(s)}
          />
        ))}
      </div>

      {/* knobs */}
      <div
        className="grid grid-cols-3 gap-3"
        style={{
          background: COLORS.panel,
          borderRadius: 12,
          padding: 10,
          boxShadow: "inset 0 3px 8px rgba(0,0,0,0.45)",
        }}
      >
        <Knob
          label="EXPERIÊNCIA"
          position={expPos}
          valueLabel={EXPERIENCE_LABELS[experience]}
          onChange={setExpPos}
        />
        <Knob
          label="CLIENTE"
          position={clientPos}
          valueLabel={CLIENT_LABELS[client]}
          onChange={setClientPos}
        />
        <Knob
          label="OPORTUNIDADE"
          position={oppPos}
          valueLabel={OPPORTUNITY_LABELS[opportunity]}
          onChange={setOppPos}
        />
      </div>

      {/* action keys */}
      <div className="grid grid-cols-2 gap-3">
        <BigKey label="ZERAR" variant="beige" side="left" onClick={reset} />
        <BigKey label="CALCULAR" variant="orange" side="right" onClick={calcular} />
      </div>
    </div>
  );
}
