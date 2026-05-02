// ─── Types projet ────────────────────────────────────────────────────────────
export type ProjectType =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'COPROPRIETE'
  | 'HOTEL'
  | 'SYNDIC';

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  RESIDENTIAL: 'Particulier / Maison individuelle',
  COMMERCIAL:  'Entreprise / Commerce',
  COPROPRIETE: 'Copropriété',
  HOTEL:       'Hôtel / Hébergement',
  SYNDIC:      'Syndic (vote AG requis)',
};

export const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
  RESIDENTIAL: 'Installation à domicile pour voiture électrique personnelle',
  COMMERCIAL:  'Borne pour salariés, clients ou flotte d\'entreprise',
  COPROPRIETE: 'Infrastructure partagée en immeuble collectif',
  HOTEL:       'Bornes pour clients, compatibles CHAdeMO / CCS / Type 2',
  SYNDIC:      'Dossier complet avec démarches en assemblée générale',
};

// ─── Niveaux de puissance ─────────────────────────────────────────────────────
export type PowerLevel = 'P1' | 'P2' | 'P3' | 'P4';

export const POWER_LEVEL_LABELS: Record<PowerLevel, string> = {
  P1: '3,7 kVA — Prise 12A (lente)',
  P2: '7 kVA — 16-32A (normale)',
  P3: '22 kVA — Triphasé (accélérée)',
  P4: '> 44 kVA — Rapide / Ultra-rapide',
};

export const POWER_LEVEL_SHORT: Record<PowerLevel, string> = {
  P1: '3,7 kVA',
  P2: '7 kVA',
  P3: '22 kVA',
  P4: '> 44 kVA',
};

export const POWER_LEVEL_DESCRIPTIONS: Record<PowerLevel, string> = {
  P1: 'Charge complète en 8-12h · Idéal usage nocturne',
  P2: 'Charge complète en 4-6h · Standard résidentiel',
  P3: 'Charge complète en 1-3h · Pro / copropriété',
  P4: 'Charge 80% en 20-45 min · Stations rapides',
};

// ─── Connecteurs ──────────────────────────────────────────────────────────────
export type ConnectorType = 'TYPE2_AC' | 'CCS' | 'CHADEMO';

export const CONNECTOR_LABELS: Record<ConnectorType, string> = {
  TYPE2_AC: 'Type 2 AC (standard européen)',
  CCS:      'CCS Combo 2 (charge rapide DC)',
  CHADEMO:  'CHAdeMO (compatible Nissan, Mitsubishi)',
};

// ─── Parking ──────────────────────────────────────────────────────────────────
export type ParkingType = 'INDOOR' | 'OUTDOOR' | 'SEMI_COVERED';

export const PARKING_TYPE_LABELS: Record<ParkingType, string> = {
  INDOOR:       'Intérieur (garage / sous-sol)',
  OUTDOOR:      'Extérieur (voie publique / parking)',
  SEMI_COVERED: 'Semi-couvert (auvent / abri)',
};

export type ParkingAccess = 'PRIVATE' | 'PUBLIC' | 'MIXED';

export const PARKING_ACCESS_LABELS: Record<ParkingAccess, string> = {
  PRIVATE: 'Privé (résident / salarié uniquement)',
  PUBLIC:  'Public (accès libre)',
  MIXED:   'Mixte (réservé + visiteurs)',
};

// ─── Statuts pipeline ─────────────────────────────────────────────────────────
export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MATCHED'
  | 'ETUDE_TECHNIQUE'
  | 'DOSSIER_AG'
  | 'QUOTE_SENT'
  | 'QUOTE_ACCEPTED'
  | 'INSTALLATION'
  | 'MISE_EN_SERVICE'
  | 'MAINTENANCE'
  | 'COMPLETED'
  | 'CANCELLED';

export const STATUS_LABELS: Record<RequestStatus, string> = {
  DRAFT:           'Brouillon',
  SUBMITTED:       'Soumise',
  MATCHED:         'Installateurs contactés',
  ETUDE_TECHNIQUE: 'Étude technique',
  DOSSIER_AG:      'Dossier AG en cours',
  QUOTE_SENT:      'Devis reçu',
  QUOTE_ACCEPTED:  'Devis accepté',
  INSTALLATION:    'Installation',
  MISE_EN_SERVICE: 'Mise en service',
  MAINTENANCE:     'Maintenance',
  COMPLETED:       'Terminée',
  CANCELLED:       'Annulée',
};

// ─── Pipeline visuel (5 grandes étapes) ──────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    key: 'ETUDE',
    label: 'Étude technique',
    statuses: ['SUBMITTED', 'MATCHED', 'ETUDE_TECHNIQUE'] as RequestStatus[],
    description: 'Analyse du site et faisabilité',
  },
  {
    key: 'DOSSIER',
    label: 'Dossier / AG',
    statuses: ['DOSSIER_AG', 'QUOTE_SENT'] as RequestStatus[],
    description: 'Devis et démarches administratives',
  },
  {
    key: 'ACCEPTATION',
    label: 'Acceptation',
    statuses: ['QUOTE_ACCEPTED'] as RequestStatus[],
    description: 'Devis signé et planification',
  },
  {
    key: 'INSTALLATION',
    label: 'Installation',
    statuses: ['INSTALLATION', 'MISE_EN_SERVICE'] as RequestStatus[],
    description: 'Pose de la borne et raccordement',
  },
  {
    key: 'SERVICE',
    label: 'En service',
    statuses: ['MAINTENANCE', 'COMPLETED'] as RequestStatus[],
    description: 'Borne active et suivi',
  },
] as const;

export function getPipelineStep(status: RequestStatus): number {
  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    if ((PIPELINE_STEPS[i].statuses as readonly string[]).includes(status)) return i;
  }
  return 0;
}

// ─── Certifications installateur ─────────────────────────────────────────────
export type CertificationType =
  | 'IRVE_P1'
  | 'IRVE_P2'
  | 'IRVE_P3'
  | 'AFNOR_CONCEPTION'
  | 'CONSUEL'
  | 'AVERE';

export const CERTIFICATION_LABELS: Record<CertificationType, string> = {
  IRVE_P1:          'IRVE P1 — Installations ≤ 3,7 kVA',
  IRVE_P2:          'IRVE P2 — Installations ≤ 22 kVA',
  IRVE_P3:          'IRVE P3 — Installations > 22 kVA',
  AFNOR_CONCEPTION: 'AFNOR — Conception IRVE',
  CONSUEL:          'CONSUEL — Conformité électrique',
  AVERE:            'AVERE-France — Label mobilité',
};

// ─── Types d'intervention ─────────────────────────────────────────────────────
export type InterventionType =
  | 'ETUDE'
  | 'INSTALLATION'
  | 'MISE_EN_SERVICE'
  | 'MAINTENANCE'
  | 'SUPERVISION';

export const INTERVENTION_LABELS: Record<InterventionType, string> = {
  ETUDE:          'Étude technique',
  INSTALLATION:   'Installation infrastructure',
  MISE_EN_SERVICE:'Mise en service',
  MAINTENANCE:    'Maintenance',
  SUPERVISION:    'Supervision / Télégestion',
};