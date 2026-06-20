import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { COLORS, MONO } from "./tokens";
import {
  SERVICE_PRICES,
  SERVICE_LABELS,
  CLIENT_LABELS,
  EXPERIENCE_MULT,
  EXPERIENCE_LABELS,
  OPPORTUNITY_MULT,
  OPPORTUNITY_LABELS,
  type Service,
  type ClientSize,
} from "./pricing";

const ORDER: Service[] = ["id", "lp", "pitchdeck"];
const TIERS: ClientSize[] = ["pequeno", "medio", "grande"];

const fmt = (n: number) => n.toLocaleString("pt-BR");
const mult = (n: number) => n.toLocaleString("pt-BR");

// Market ranges each service's BRL price is calibrated against (Brazil, 2025/26).
const SOURCES: { svc: Service; range: string }[] = [
  {
    svc: "id",
    range: "logo R$500–5k · identidade completa R$3–10k · branding especialista R$15–40k",
  },
  {
    svc: "lp",
    range: "R$497–7,1k freelance · agências R$3–20k",
  },
  {
    svc: "pitchdeck",
    range: "design de apresentação R$500–5k+ · pitch especializado no topo",
  },
];

const expLine = (Object.keys(EXPERIENCE_MULT) as (keyof typeof EXPERIENCE_MULT)[])
  .map((k) => `${EXPERIENCE_LABELS[k]} ×${mult(EXPERIENCE_MULT[k])}`)
  .join("  ·  ");
const oppLine = (Object.keys(OPPORTUNITY_MULT) as (keyof typeof OPPORTUNITY_MULT)[])
  .map((k) => `${OPPORTUNITY_LABELS[k]} ×${mult(OPPORTUNITY_MULT[k])}`)
  .join("  ·  ");

const heading: React.CSSProperties = {
  color: COLORS.orange,
  fontSize: 11,
  letterSpacing: "0.18em",
  margin: "0 0 8px",
};
const body: React.CSSProperties = {
  color: "#cdbf9e",
  fontSize: 12.5,
  lineHeight: 1.55,
  margin: 0,
};

export function MethodologyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Metodologia e fontes dos preços"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0,17,14,0.82)",
        backdropFilter: "blur(2px)",
        fontFamily: MONO,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: 12,
          border: `1px solid ${COLORS.knobRing}`,
          background: `radial-gradient(120% 100% at 50% 0%, ${COLORS.screen} 0%, ${COLORS.screenDeep} 100%)`,
          padding: 22,
          boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 0 24px rgba(0,0,0,0.45)",
        }}
      >
        {/* header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <span style={{ color: COLORS.teal, fontSize: 14, letterSpacing: "0.16em" }}>
            METODOLOGIA & FONTES
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{ color: "#bcae8f", cursor: "pointer", lineHeight: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* how we calculate */}
        <section style={{ marginBottom: 18 }}>
          <h3 style={heading}>COMO CALCULAMOS</h3>
          <p style={body}>
            Preço = soma dos serviços ativos (coluna do porte do cliente) ×
            experiência × oportunidade.
          </p>
          <p style={{ ...body, marginTop: 6 }}>
            <span style={{ color: COLORS.teal }}>Experiência:</span> {expLine}
          </p>
          <p style={body}>
            <span style={{ color: COLORS.teal }}>Oportunidade:</span> {oppLine}
          </p>
        </section>

        {/* base prices table */}
        <section style={{ marginBottom: 18 }}>
          <h3 style={heading}>VALORES BASE (R$ · NÍVEL PLENO)</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
              gap: "6px 10px",
              fontSize: 12,
            }}
          >
            <span />
            {TIERS.map((t) => (
              <span key={t} style={{ color: "#bcae8f", textAlign: "right", letterSpacing: "0.06em" }}>
                {CLIENT_LABELS[t]}
              </span>
            ))}
            {ORDER.map((s) => (
              <Row key={s} svc={s} />
            ))}
          </div>
        </section>

        {/* sources */}
        <section>
          <h3 style={heading}>FONTES — MERCADO BR (2025/26)</h3>
          {SOURCES.map(({ svc, range }) => (
            <div key={svc} style={{ marginBottom: 10 }}>
              <p style={{ ...body, color: COLORS.orange }}>{SERVICE_LABELS[svc]}</p>
              <p style={body}>{range}</p>
            </div>
          ))}
          <p style={{ ...body, fontSize: 11, color: "#8a9389", marginTop: 8 }}>
            Valores calibrados ao mercado brasileiro — não é conversão direta do dólar.
          </p>
        </section>
      </div>
    </div>,
    document.body,
  );
}

function Row({ svc }: { svc: Service }) {
  return (
    <>
      <span style={{ color: COLORS.teal }}>{SERVICE_LABELS[svc]}</span>
      {TIERS.map((t) => (
        <span key={t} style={{ color: "#cdbf9e", textAlign: "right" }}>
          {fmt(SERVICE_PRICES[svc][t])}
        </span>
      ))}
    </>
  );
}
