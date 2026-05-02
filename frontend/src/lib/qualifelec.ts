// lib/qualifelec.ts
// ─────────────────────────────────────────────────────────────────────────────
// DEV  : 8 SIRETs de test couvrant tous les scénarios
// PROD : API Entreprise v3 — token DINUM requis
// ─────────────────────────────────────────────────────────────────────────────

export interface QualifelecResult {
  valid: boolean;
  message: string;
  indices?: string[];
  certNumber?: string;
  expiresAt?: string;
}

const IS_DEV =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_QUALIFELEC_DEV_MODE === 'true';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DB — vraie structure JSON API Entreprise v3
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_DB: Record<string, object> = {

  // ─── 3 SIRET avec les 3 indices IRVE1 + IRVE2 + IRVE3 ───────────────────

  // ✅ IRVE1 + IRVE2 + IRVE3 — Grande entreprise, RGE, classe 3
  '11111111111111': {
    data: [{
      data: {
        numero: 1001,
        rge: true,
        date_debut: '2022-01-01',
        date_fin: '2026-12-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2022-01-01',
          date_fin: '2026-12-31',
          indices: [
            { code: 'IRVE1', label: 'IRVE – indice 1 (puissance ≤ 36 kVA)' },
            { code: 'IRVE2', label: 'IRVE – indice 2 (puissance ≤ 22 kW communicante)' },
            { code: 'IRVE3', label: 'IRVE – indice 3 (infrastructure collective)' },
          ],
          mentions: [{ code: 'RGE', label: 'Reconnu Garant de l\'Environnement' }],
          classification: { code: '3', label: 'Classe 3 - de 10 à 19 exécutants' },
        },
        assurance_decennale: { nom: 'AXA', date_debut: '2022-01-01', date_fin: '2026-12-31' },
        assurance_civile:    { nom: 'ALLIANZ', date_debut: '2022-01-01', date_fin: '2026-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE1 + IRVE2 + IRVE3 — Entreprise moyenne, RGE, classe 2
  '22222222222222': {
    data: [{
      data: {
        numero: 1002,
        rge: true,
        date_debut: '2021-06-01',
        date_fin: '2025-05-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2021-06-01',
          date_fin: '2025-05-31',
          indices: [
            { code: 'IRVE1', label: 'IRVE – indice 1 (puissance ≤ 36 kVA)' },
            { code: 'IRVE2', label: 'IRVE – indice 2 (puissance ≤ 22 kW communicante)' },
            { code: 'IRVE3', label: 'IRVE – indice 3 (infrastructure collective)' },
          ],
          mentions: [{ code: 'RGE', label: 'Reconnu Garant de l\'Environnement' }],
          classification: { code: '2', label: 'Classe 2 - de 4 à 9 exécutants' },
        },
        assurance_decennale: { nom: 'MAAF', date_debut: '2021-01-01', date_fin: '2025-12-31' },
        assurance_civile:    { nom: 'GENERALI', date_debut: '2021-01-01', date_fin: '2025-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE1 + IRVE2 + IRVE3 — Petite entreprise, sans RGE, classe 1
  '33333333333333': {
    data: [{
      data: {
        numero: 1003,
        rge: false,
        date_debut: '2023-03-01',
        date_fin: '2027-02-28',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2023-03-01',
          date_fin: '2027-02-28',
          indices: [
            { code: 'IRVE1', label: 'IRVE – indice 1 (puissance ≤ 36 kVA)' },
            { code: 'IRVE2', label: 'IRVE – indice 2 (puissance ≤ 22 kW communicante)' },
            { code: 'IRVE3', label: 'IRVE – indice 3 (infrastructure collective)' },
          ],
          mentions: [],
          classification: { code: '1', label: 'Classe 1 - de 1 à 3 exécutants' },
        },
        assurance_decennale: { nom: 'BNP PARIBAS CARDIF', date_debut: '2023-01-01', date_fin: '2027-12-31' },
        assurance_civile:    { nom: 'HISCOX', date_debut: '2023-01-01', date_fin: '2027-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ─── 4 SIRET avec 2 indices parmi IRVE1/IRVE2/IRVE3 ────────────────────

  // ✅ IRVE1 + IRVE2 — Particuliers et bornes communicantes
  '44444444444444': {
    data: [{
      data: {
        numero: 2001,
        rge: true,
        date_debut: '2022-09-01',
        date_fin: '2026-08-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2022-09-01',
          date_fin: '2026-08-31',
          indices: [
            { code: 'IRVE1', label: 'IRVE – indice 1 (puissance ≤ 36 kVA)' },
            { code: 'IRVE2', label: 'IRVE – indice 2 (puissance ≤ 22 kW communicante)' },
          ],
          mentions: [{ code: 'RGE', label: 'Reconnu Garant de l\'Environnement' }],
          classification: { code: '2', label: 'Classe 2 - de 4 à 9 exécutants' },
        },
        assurance_decennale: { nom: 'GROUPAMA', date_debut: '2022-01-01', date_fin: '2026-12-31' },
        assurance_civile:    { nom: 'COVEA', date_debut: '2022-01-01', date_fin: '2026-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE1 + IRVE3 — Particuliers et infrastructures collectives (sans IRVE2)
  '55555555555555': {
    data: [{
      data: {
        numero: 2002,
        rge: false,
        date_debut: '2020-01-01',
        date_fin: '2024-12-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2020-01-01',
          date_fin: '2024-12-31',
          indices: [
            { code: 'IRVE1', label: 'IRVE – indice 1 (puissance ≤ 36 kVA)' },
            { code: 'IRVE3', label: 'IRVE – indice 3 (infrastructure collective)' },
          ],
          mentions: [],
          classification: { code: '1', label: 'Classe 1 - de 1 à 3 exécutants' },
        },
        assurance_decennale: { nom: 'SWISS LIFE', date_debut: '2020-01-01', date_fin: '2024-12-31' },
        assurance_civile:    { nom: 'ZURICH', date_debut: '2020-01-01', date_fin: '2024-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE2 + IRVE3 — Bornes communicantes et infrastructures (sans IRVE1)
  '66666666666666': {
    data: [{
      data: {
        numero: 2003,
        rge: true,
        date_debut: '2023-07-01',
        date_fin: '2027-06-30',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2023-07-01',
          date_fin: '2027-06-30',
          indices: [
            { code: 'IRVE2', label: 'IRVE – indice 2 (puissance ≤ 22 kW communicante)' },
            { code: 'IRVE3', label: 'IRVE – indice 3 (infrastructure collective)' },
          ],
          mentions: [{ code: 'RGE', label: 'Reconnu Garant de l\'Environnement' }],
          classification: { code: '3', label: 'Classe 3 - de 10 à 19 exécutants' },
        },
        assurance_decennale: { nom: 'SMABTP', date_debut: '2023-01-01', date_fin: '2027-12-31' },
        assurance_civile:    { nom: 'MMA', date_debut: '2023-01-01', date_fin: '2027-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE1 + IRVE2 — Probatoire (nouveau qualifié)
  '77777777777777': {
    data: [{
      data: {
        numero: 2004,
        rge: false,
        date_debut: '2024-01-01',
        date_fin: '2026-12-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2024-01-01',
          date_fin: '2026-12-31',
          indices: [
            { code: 'IRVE1', label: 'IRVE – indice 1 (puissance ≤ 36 kVA)' },
            { code: 'IRVE2', label: 'IRVE – indice 2 (puissance ≤ 22 kW communicante)' },
          ],
          mentions: [{ code: 'PRGE', label: 'Probatoire Reconnu Garant de l\'Environnement' }],
          classification: null,
        },
        assurance_decennale: { nom: 'AXA', date_debut: '2024-01-01', date_fin: '2026-12-31' },
        assurance_civile:    { nom: 'AXA', date_debut: '2024-01-01', date_fin: '2026-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ─── 5 SIRET avec 1 seul indice (IRVE1 ou IRVE2 ou IRVE3) ──────────────

  // ✅ IRVE1 seulement — Borne simple ≤ 36 kVA
  '10000000000001': {
    data: [{
      data: {
        numero: 3001,
        rge: false,
        date_debut: '2022-01-01',
        date_fin: '2026-12-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2022-01-01',
          date_fin: '2026-12-31',
          indices: [
            { code: 'IRVE1', label: 'IRVE – indice 1 (puissance ≤ 36 kVA)' },
          ],
          mentions: [],
          classification: { code: '1', label: 'Classe 1 - de 1 à 3 exécutants' },
        },
        assurance_decennale: { nom: 'MAAF', date_debut: '2022-01-01', date_fin: '2026-12-31' },
        assurance_civile:    { nom: 'MAAF', date_debut: '2022-01-01', date_fin: '2026-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE2 seulement — Borne communicante ≤ 22 kW
  '20000000000002': {
    data: [{
      data: {
        numero: 3002,
        rge: true,
        date_debut: '2023-01-01',
        date_fin: '2027-12-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2023-01-01',
          date_fin: '2027-12-31',
          indices: [
            { code: 'IRVE2', label: 'IRVE – indice 2 (puissance ≤ 22 kW communicante)' },
          ],
          mentions: [{ code: 'RGE', label: 'Reconnu Garant de l\'Environnement' }],
          classification: { code: '2', label: 'Classe 2 - de 4 à 9 exécutants' },
        },
        assurance_decennale: { nom: 'GENERALI', date_debut: '2023-01-01', date_fin: '2027-12-31' },
        assurance_civile:    { nom: 'GENERALI', date_debut: '2023-01-01', date_fin: '2027-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE3 seulement — Infrastructure collective copropriété/parking
  '30000000000003': {
    data: [{
      data: {
        numero: 3003,
        rge: true,
        date_debut: '2021-01-01',
        date_fin: '2025-12-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2021-01-01',
          date_fin: '2025-12-31',
          indices: [
            { code: 'IRVE3', label: 'IRVE – indice 3 (infrastructure collective)' },
          ],
          mentions: [{ code: 'RGE', label: 'Reconnu Garant de l\'Environnement' }],
          classification: { code: '3', label: 'Classe 3 - de 10 à 19 exécutants' },
        },
        assurance_decennale: { nom: 'ALLIANZ', date_debut: '2021-01-01', date_fin: '2025-12-31' },
        assurance_civile:    { nom: 'ALLIANZ', date_debut: '2021-01-01', date_fin: '2025-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE1 seulement — Qualifié RGE (avec mention)
  '40000000000004': {
    data: [{
      data: {
        numero: 3004,
        rge: true,
        date_debut: '2024-06-01',
        date_fin: '2028-05-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2024-06-01',
          date_fin: '2028-05-31',
          indices: [
            { code: 'IRVE1', label: 'IRVE – indice 1 (puissance ≤ 36 kVA)' },
          ],
          mentions: [{ code: 'RGE', label: 'Reconnu Garant de l\'Environnement' }],
          classification: { code: '1', label: 'Classe 1 - de 1 à 3 exécutants' },
        },
        assurance_decennale: { nom: 'PACIFICA', date_debut: '2024-01-01', date_fin: '2028-12-31' },
        assurance_civile:    { nom: 'PACIFICA', date_debut: '2024-01-01', date_fin: '2028-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ✅ IRVE2 seulement — Probatoire, nouvelle entreprise
  '50000000000005': {
    data: [{
      data: {
        numero: 3005,
        rge: false,
        date_debut: '2025-01-01',
        date_fin: '2027-12-31',
        qualification: {
          label: 'Installations Électriques IRVE',
          date_debut: '2025-01-01',
          date_fin: '2027-12-31',
          indices: [
            { code: 'IRVE2', label: 'IRVE – indice 2 (puissance ≤ 22 kW communicante)' },
          ],
          mentions: [{ code: 'PRGE', label: 'Probatoire Reconnu Garant de l\'Environnement' }],
          classification: null,
        },
        assurance_decennale: { nom: 'HISCOX', date_debut: '2025-01-01', date_fin: '2027-12-31' },
        assurance_civile:    { nom: 'HISCOX', date_debut: '2025-01-01', date_fin: '2027-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ─── Cas de refus ────────────────────────────────────────────────────────

  // ❌ Qualifié Qualifelec mais SANS indice IRVE (LCPT uniquement)
  '99999999999991': {
    data: [{
      data: {
        numero: 9001,
        rge: false,
        date_debut: '2020-01-01',
        date_fin: '2024-12-31',
        qualification: {
          label: 'Installations Électriques Logement Commerce Petit Tertiaire - LCPT',
          date_debut: '2020-01-01',
          date_fin: '2024-12-31',
          indices: [],
          mentions: [],
          classification: { code: '1', label: 'Classe 1 - de 1 à 3 exécutants' },
        },
        assurance_decennale: { nom: 'AXA', date_debut: '2020-01-01', date_fin: '2024-12-31' },
        assurance_civile:    { nom: 'AXA', date_debut: '2020-01-01', date_fin: '2024-12-31' },
      },
      links: {}, meta: {},
    }],
    meta: {}, links: {},
  },

  // ❌ SIRET introuvable dans la base Qualifelec
  '99999999999999': {
    data: [], meta: {}, links: {},
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires — vraie structure API v3 : data[].data.qualification.indices[].code
// ─────────────────────────────────────────────────────────────────────────────
function extractIrveIndices(apiResponse: any): string[] {
  return (apiResponse?.data ?? [])
    .flatMap((item: any) =>
      item?.data?.qualification?.indices?.map((i: any) => i.code) ?? []
    )
    .filter((code: string) => code.startsWith('IRVE'));
}

function getFirstCertData(apiResponse: any): any {
  return apiResponse?.data?.[0]?.data ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyQualifelec(
  siret: string
): Promise<QualifelecResult> {
  const clean = siret.replace(/\s/g, '');
  return IS_DEV ? _verifyMock(clean) : _verifyProd(clean);
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE DEV
// ─────────────────────────────────────────────────────────────────────────────
async function _verifyMock(siret: string): Promise<QualifelecResult> {
  await new Promise(r => setTimeout(r, 700));

  const response = MOCK_DB[siret];
  if (!response) {
    return { valid: false, message: `SIRET ${siret} non trouvé dans la base Qualifelec.` };
  }

  const certs = (response as any).data ?? [];
  if (!certs.length) {
    return { valid: false, message: 'Aucun certificat Qualifelec pour ce SIRET.' };
  }

  const irveIndices = extractIrveIndices(response);
  if (!irveIndices.length) {
    const label = getFirstCertData(response)?.qualification?.label ?? '';
    return {
      valid: false,
      message: `Entreprise qualifiée Qualifelec mais sans qualification IRVE (${label}).`,
    };
  }

  const cert = getFirstCertData(response);
  return {
    valid: true,
    message: `✅ Qualification IRVE confirmée — ${irveIndices.join(', ')}`,
    indices: irveIndices,
    certNumber: String(cert?.numero ?? 'N/A'),
    expiresAt: cert?.date_fin,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE PROD — API Entreprise v3
// ─────────────────────────────────────────────────────────────────────────────
async function _verifyProd(siret: string): Promise<QualifelecResult> {
  const token = process.env.NEXT_PUBLIC_API_ENTREPRISE_TOKEN;
  if (!token) {
    console.error('[Qualifelec] NEXT_PUBLIC_API_ENTREPRISE_TOKEN manquant');
    return { valid: false, message: 'Configuration API Entreprise manquante.' };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://entreprise.api.gouv.fr/v3/qualifelec/etablissements/${siret}/certificats`,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
  } catch {
    return { valid: false, message: 'Erreur réseau lors de la vérification Qualifelec.' };
  }

  if (res.status === 404) return { valid: false, message: 'SIRET non trouvé dans la base Qualifelec.' };
  if (res.status === 401 || res.status === 403) return { valid: false, message: 'Token API Entreprise invalide ou expiré.' };
  if (!res.ok) return { valid: false, message: `Erreur API Entreprise (HTTP ${res.status}).` };

  const data = await res.json();
  const certs = data?.data ?? [];
  if (!certs.length) return { valid: false, message: 'Aucun certificat Qualifelec pour ce SIRET.' };

  const irveIndices = extractIrveIndices(data);
  if (!irveIndices.length) return { valid: false, message: 'Entreprise qualifiée Qualifelec mais sans mention IRVE.' };

  const cert = getFirstCertData(data);
  return {
    valid: true,
    message: `✅ Qualification IRVE confirmée — ${irveIndices.join(', ')}`,
    indices: irveIndices,
    certNumber: String(cert?.numero ?? 'N/A'),
    expiresAt: cert?.date_fin,
  };
}