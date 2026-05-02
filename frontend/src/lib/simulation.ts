import type { ProjectType, PowerLevel } from '@/types';

// ─── Barème ADVENIR (2024) ────────────────────────────────────────────────────
// Source : AVERE-France — programme ADVENIR
// https://advenir.mobi/beneficier-dadvenir/

export interface SimulationResult {
  basePrice: number;          // Estimation prix HT installateur
  advenirAid: number;         // Aide ADVENIR
  taxCredit: number;          // Crédit d'impôt (particuliers uniquement)
  totalAids: number;          // Total aides
  netPrice: number;           // Prix net après aides
  vatAmount: number;          // TVA 5,5% ou 10%
  netTTC: number;             // TTC après aides
  details: AidDetail[];
}

export interface AidDetail {
  label: string;
  amount: number;
  rate?: string;
  condition?: string;
}

// Taux TVA réduit applicable aux travaux de rénovation énergétique
const VAT_RATE = 0.055; // 5,5%

// Forfaits ADVENIR par type de projet (aide par point de charge)
const ADVENIR_RATES: Record<string, { rate: number; cap: number; label: string }> = {
  RESIDENTIAL_COLLECTIVE: { rate: 0.50, cap: 960,  label: 'Résidentiel collectif (50% plafonné)' },
  COMMERCIAL:             { rate: 0.30, cap: 1200, label: 'Entreprise / Commerce (30% plafonné)' },
  COPROPRIETE:            { rate: 0.50, cap: 1750, label: 'Copropriété (50% plafonné)' },
  HOTEL:                  { rate: 0.30, cap: 1200, label: 'Hébergement touristique (30%)' },
  SYNDIC:                 { rate: 0.50, cap: 1750, label: 'Syndic / Copropriété (50%)' },
};

// Prix de base estimatifs HT selon type + puissance (hors aides)
const BASE_PRICES: Record<ProjectType, Record<PowerLevel, number>> = {
  RESIDENTIAL: { P1: 800,  P2: 1200, P3: 2500, P4: 8000  },
  COMMERCIAL:  { P1: 1200, P2: 1800, P3: 3500, P4: 15000 },
  COPROPRIETE: { P1: 1500, P2: 2200, P3: 4000, P4: 18000 },
  HOTEL:       { P1: 1400, P2: 2000, P3: 4500, P4: 20000 },
  SYNDIC:      { P1: 1500, P2: 2200, P3: 4000, P4: 18000 },
};

export function simulate(
  projectType: ProjectType,
  powerLevel: PowerLevel,
  quantity = 1,
): SimulationResult {
  const basePrice = BASE_PRICES[projectType][powerLevel] * quantity;
  const details: AidDetail[] = [];

  // ── Aide ADVENIR ──────────────────────────────────────────────────────────
  let advenirAid = 0;
  const advenirKey =
    projectType === 'RESIDENTIAL' ? 'RESIDENTIAL_COLLECTIVE'
    : projectType === 'COMMERCIAL' ? 'COMMERCIAL'
    : projectType === 'COPROPRIETE' ? 'COPROPRIETE'
    : projectType === 'HOTEL' ? 'HOTEL'
    : 'SYNDIC';

  const advenir = ADVENIR_RATES[advenirKey];
  if (advenir) {
    const rawAid = basePrice * advenir.rate;
    advenirAid = Math.min(rawAid, advenir.cap * quantity);
    details.push({
      label: `ADVENIR — ${advenir.label}`,
      amount: advenirAid,
      rate: `${advenir.rate * 100}%`,
      condition: `Plafond : ${advenir.cap.toLocaleString('fr-FR')} € / point de charge`,
    });
  }

  // ── Crédit d'impôt (particuliers uniquement, art. 200 quater C CGI) ────────
  let taxCredit = 0;
  if (projectType === 'RESIDENTIAL') {
    // 75% du coût plafonné à 300 € par foyer
    taxCredit = Math.min(basePrice * 0.75, 300);
    details.push({
      label: "Crédit d'impôt — Résidence principale (art. 200 quater C)",
      amount: taxCredit,
      rate: '75%',
      condition: 'Plafond 300 € par foyer fiscal',
    });
  }

  const totalAids = advenirAid + taxCredit;
  const netPrice = Math.max(0, basePrice - totalAids);
  const vatAmount = netPrice * VAT_RATE;
  const netTTC = netPrice + vatAmount;

  return {
    basePrice,
    advenirAid,
    taxCredit,
    totalAids,
    netPrice,
    vatAmount,
    netTTC,
    details,
  };
}

export function formatEur(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
}