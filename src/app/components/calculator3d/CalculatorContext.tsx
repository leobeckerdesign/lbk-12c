import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
} from "../calculator/pricing";

type Pos = 0 | 1 | 2;

const SERVICE_ORDER: Service[] = ["id", "lp", "pitchdeck"];
const EXPERIENCE_BY_POS: Experience[] = ["junior", "pleno", "senior"];
const CLIENT_BY_POS: ClientSize[] = ["pequeno", "medio", "grande"];
const OPPORTUNITY_BY_POS: Opportunity[] = ["pouca", "media", "alta"];

export interface CalculatorState {
  services: Service[];
  isActive: (s: Service) => boolean;
  toggleService: (s: Service) => void;

  expPos: Pos;
  clientPos: Pos;
  oppPos: Pos;
  cycleExp: () => void;
  cycleClient: () => void;
  cycleOpp: () => void;

  experienceLabel: string;
  clientLabel: string;
  opportunityLabel: string;

  show: boolean;
  projectPrice: number;
  flash: boolean;
  servicesLine: string;
  selectorsLine: string;

  calcular: () => void;
  reset: () => void;
}

const Ctx = createContext<CalculatorState | null>(null);

export function useCalculator(): CalculatorState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCalculator must be used within <CalculatorProvider>");
  return v;
}

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const custo = CUSTO_START;
  const [expPos, setExpPos] = useState<Pos>(1);
  const [clientPos, setClientPos] = useState<Pos>(1);
  const [oppPos, setOppPos] = useState<Pos>(1);
  const [flash, setFlash] = useState(false);
  const [calcResult, setCalcResult] = useState<PricingResult | null>(null);

  const experience = EXPERIENCE_BY_POS[expPos];
  const client = CLIENT_BY_POS[clientPos];
  const opportunity = OPPORTUNITY_BY_POS[oppPos];

  const result = useMemo(
    () => calculatePrice({ services, client, experience, opportunity, custo }),
    [services, client, experience, opportunity, custo],
  );

  const toggleService = useCallback(
    (s: Service) =>
      setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])),
    [],
  );

  const cycle = (set: (fn: (p: Pos) => Pos) => void) =>
    set((p) => (((p + 1) % 3) as Pos));

  const calcular = useCallback(() => {
    setCalcResult(result);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 320);
  }, [result]);

  const reset = useCallback(() => {
    setServices([]);
    setExpPos(1);
    setClientPos(1);
    setOppPos(1);
    setCalcResult(null);
  }, []);

  const servicesLine = SERVICE_ORDER.filter((s) => services.includes(s))
    .map((s) => SERVICE_LABELS[s])
    .join("+");
  const selectorsLine = `${EXPERIENCE_LABELS[experience]} / ${CLIENT_LABELS[client]} / ${OPPORTUNITY_LABELS[opportunity]}`;

  const value: CalculatorState = {
    services,
    isActive: (s) => services.includes(s),
    toggleService,
    expPos,
    clientPos,
    oppPos,
    cycleExp: () => cycle(setExpPos),
    cycleClient: () => cycle(setClientPos),
    cycleOpp: () => cycle(setOppPos),
    experienceLabel: EXPERIENCE_LABELS[experience],
    clientLabel: CLIENT_LABELS[client],
    opportunityLabel: OPPORTUNITY_LABELS[opportunity],
    show: calcResult !== null && services.length > 0,
    projectPrice: calcResult?.projectPrice ?? 0,
    flash,
    servicesLine,
    selectorsLine,
    calcular,
    reset,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
