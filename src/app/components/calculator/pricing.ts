// Pure, well-typed pricing model for the LBK-12C freelancer calculator.
// All tunable numbers live here so the formula is easy to tweak later.

export type Service = "id" | "lp" | "pitchdeck";
export type ClientSize = "pequeno" | "medio" | "grande";
export type Experience = "junior" | "pleno" | "senior";
export type Opportunity = "pouca" | "media" | "alta";

export interface PricingInput {
  /** Active services (independent toggles). */
  services: Service[];
  /** Selected client size — picks the price column. */
  client: ClientSize;
  /** Experience level — multiplies the service sum. */
  experience: Experience;
  /** Opportunity level — strategic discount multiplier. */
  opportunity: Opportunity;
  /** Freelancer minimum monthly cost (BRL). Used only for perspective. */
  custo: number;
}

export interface PricingResult {
  /** Sum of selected services using the client column. */
  base: number;
  /** Final project price -> main display. */
  projectPrice: number;
  /** Derived minimum hourly rate. */
  hourlyMin: number;
  /** Hours of the freelancer's minimum that the project covers. */
  hoursEquiv: number;
}

/**
 * Market prices per service, by client size, in BRL — calibrated to the
 * 2025/2026 *Brazilian* freelance/agency market (not a direct USD conversion):
 *   - ID (identidade visual): logo R$500-5k, identidade completa R$3-10k,
 *     branding especialista R$15-40k.
 *   - LP (landing page): R$497-7.1k freelance, agências R$3-20k.
 *   - PITCH DECK: design de apresentação R$500-5k+, pitch especializado no topo.
 * Values are the "pleno" baseline; experience/opportunity multipliers adjust
 * from here. The client size selects the column (não há multiplicador extra).
 */
export const SERVICE_PRICES: Record<Service, Record<ClientSize, number>> = {
  id: { pequeno: 2500, medio: 7000, grande: 18000 },
  lp: { pequeno: 1800, medio: 4500, grande: 12000 },
  pitchdeck: { pequeno: 2000, medio: 6000, grande: 15000 },
};

export const EXPERIENCE_MULT: Record<Experience, number> = {
  junior: 0.75,
  pleno: 1.0,
  senior: 1.4,
};

export const OPPORTUNITY_MULT: Record<Opportunity, number> = {
  pouca: 1.0,
  media: 0.9,
  alta: 0.8,
};

/** Average billable hours in a month (used to derive the minimum hourly rate). */
export const MONTHLY_HOURS = 173.3;

/** CUSTO control bounds. */
export const CUSTO_START = 4500;
export const CUSTO_STEP = 500;
export const CUSTO_MIN = 500;

/** Short uppercase labels shown on the display for each service. */
export const SERVICE_LABELS: Record<Service, string> = {
  id: "ID",
  lp: "LP",
  pitchdeck: "PITCH DECK",
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  junior: "JÚNIOR",
  pleno: "PLENO",
  senior: "SÊNIOR",
};

export const CLIENT_LABELS: Record<ClientSize, string> = {
  pequeno: "PEQUENO",
  medio: "MÉDIO",
  grande: "GRANDE",
};

export const OPPORTUNITY_LABELS: Record<Opportunity, string> = {
  pouca: "POUCA",
  media: "MÉDIA",
  alta: "ALTA",
};

/** The single source of truth for the calculation. */
export function calculatePrice(input: PricingInput): PricingResult {
  const base = input.services.reduce(
    (sum, service) => sum + SERVICE_PRICES[service][input.client],
    0,
  );
  const projectPrice =
    base * EXPERIENCE_MULT[input.experience] * OPPORTUNITY_MULT[input.opportunity];
  const hourlyMin = input.custo / MONTHLY_HOURS;
  const hoursEquiv = hourlyMin > 0 ? projectPrice / hourlyMin : 0;

  return { base, projectPrice, hourlyMin, hoursEquiv };
}

/** Format a BRL amount with thousands separators and no decimals (pt-BR). */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("pt-BR");
}
