'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, ArrowLeft, ArrowRight, CheckCircle, Home, Building2,
  Hotel, Users, MapPin, Plug, ParkingSquare, AlertCircle, Shield,
} from 'lucide-react';
import { requestsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  PROJECT_TYPE_LABELS, PROJECT_TYPE_DESCRIPTIONS,
  POWER_LEVEL_LABELS, POWER_LEVEL_DESCRIPTIONS, POWER_LEVEL_SHORT,
  CONNECTOR_LABELS, PARKING_TYPE_LABELS, PARKING_ACCESS_LABELS,
  type ProjectType, type PowerLevel, type ConnectorType,
  type ParkingType, type ParkingAccess,
} from '@/types';

const PROJECT_ICONS: Record<ProjectType, any> = {
  RESIDENTIAL: Home, COMMERCIAL: Building2, COPROPRIETE: Users, HOTEL: Hotel, SYNDIC: Users,
};
const CONNECTORS: ConnectorType[]   = ['TYPE2_AC', 'CCS', 'CHADEMO'];
const POWER_LEVELS: PowerLevel[]    = ['P1', 'P2', 'P3', 'P4'];
const PARKING_TYPES: ParkingType[]  = ['INDOOR', 'OUTDOOR', 'SEMI_COVERED'];
const PARKING_ACCESS: ParkingAccess[] = ['PRIVATE', 'PUBLIC', 'MIXED'];

const STEPS = [
  { id: 1, label: 'Type de projet' },
  { id: 2, label: 'Puissance & Connecteurs' },
  { id: 3, label: 'Lieu & Parking' },
  { id: 4, label: 'Récapitulatif & Envoi' },
];

interface FormData {
  projectType: ProjectType | '';
  powerLevel: PowerLevel | '';
  connectors: ConnectorType[];
  quantity: number;
  address: string;
  city: string;
  postalCode: string;
  parkingType: ParkingType | '';
  parkingAccess: ParkingAccess | '';
  parkingSpots: number;
  hasExistingPanel: boolean;
  description: string;
}

const INITIAL: FormData = {
  projectType: '', powerLevel: '', connectors: ['TYPE2_AC'], quantity: 1,
  address: '', city: '', postalCode: '', parkingType: '', parkingAccess: '',
  parkingSpots: 1, hasExistingPanel: false, description: '',
};

export default function NewRequestPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);

  // Récupérer l'installateur ciblé depuis l'URL (si venu depuis la recherche)
  const installerId   = searchParams.get('installerId')   || '';
  const installerName = searchParams.get('installerName') || '';
  const isTargeted    = !!installerId; // Demande ciblée à UN installateur précis

  useEffect(() => {
    const u = localStorage.getItem('irve_user');
    if (!u) {
      // Sauvegarder l'URL courante pour y revenir après login
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, []);

  const canNext = () => {
    if (step === 1) return !!form.projectType;
    if (step === 2) return !!form.powerLevel && form.connectors.length > 0;
    if (step === 3) return !!form.address.trim() && !!form.city.trim() && !!form.postalCode.trim() && !!form.parkingType && !!form.parkingAccess;
    return true;
  };

  const toggleConnector = (c: ConnectorType) => {
    setForm(f => ({
      ...f,
      connectors: f.connectors.includes(c) ? f.connectors.filter(x => x !== c) : [...f.connectors, c],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await requestsApi.create({
        projectType:      form.projectType,
        powerLevel:       form.powerLevel,
        quantity:         form.quantity,
        address:          form.address,
        city:             form.city,
        postalCode:       form.postalCode,
        hasExistingPanel: form.hasExistingPanel,
        description:      form.description,
        // ✅ Champs ciblage : seulement cet installateur recevra la demande
        ...(installerId ? { targetInstallerId: installerId, source: 'DIRECT' } : { source: 'ZONE' }),
      });

      if (isTargeted) {
        toast.success(`Demande envoyée à ${installerName || 'l\'installateur'} ! Un email lui a été envoyé.`);
      } else {
        toast.success('Demande envoyée ! Vous serez contacté rapidement.');
      }
      router.push('/dashboard');
    } catch (err: any) {
      console.error('DETAIL:', err.response?.data);
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />Retour au tableau de bord
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande d'installation</h1>

          {/* Bannière installateur ciblé */}
          {isTargeted && (
            <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
              <Shield className="w-4 h-4 flex-shrink-0 text-green-600" />
              <span>
                Cette demande sera envoyée <strong>uniquement à {installerName || 'cet installateur'}</strong>.
                Un email lui sera automatiquement envoyé.
              </span>
            </div>
          )}

          {!isTargeted && (
            <p className="text-sm text-gray-500 mt-1">
              Décrivez votre projet, nous trouvons l'installateur certifié le plus proche.
            </p>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
                  ${step > s.id ? 'bg-green-500 text-white'
                    : step === s.id ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-gray-200 text-gray-400'}`}>
                  {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap hidden sm:block
                  ${step === s.id ? 'text-primary' : step > s.id ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 sm:w-12 mx-1 flex-shrink-0 transition-all ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ─── ÉTAPE 1 — Type de projet ────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Quel est votre type de projet ?</h2>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map(type => {
                const Icon = PROJECT_ICONS[type];
                const selected = form.projectType === type;
                return (
                  <button key={type} onClick={() => setForm(f => ({ ...f, projectType: type }))}
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-start gap-4 transition-all
                      ${selected ? 'border-primary bg-primary-light shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-gray-800'}`}>{PROJECT_TYPE_LABELS[type]}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{PROJECT_TYPE_DESCRIPTIONS[type]}</p>
                    </div>
                    {selected && <CheckCircle className="w-5 h-5 text-primary ml-auto flex-shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
            {form.projectType === 'SYNDIC' && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <p>Un dossier syndic nécessite un vote en assemblée générale. Notre équipe vous accompagne dans toutes les démarches administratives.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── ÉTAPE 2 — Puissance & Connecteurs ─────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Puissance souhaitée</h2>
              <p className="text-sm text-gray-500 mb-3">Choisissez selon votre usage quotidien.</p>
              <div className="grid grid-cols-1 gap-3">
                {POWER_LEVELS.map(level => {
                  const selected = form.powerLevel === level;
                  return (
                    <button key={level} onClick={() => setForm(f => ({ ...f, powerLevel: level }))}
                      className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 transition-all
                        ${selected ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
                        ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {POWER_LEVEL_SHORT[level]}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-gray-800'}`}>{POWER_LEVEL_LABELS[level]}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{POWER_LEVEL_DESCRIPTIONS[level]}</p>
                      </div>
                      {selected && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Normes de connexion</h2>
              <p className="text-sm text-gray-500 mb-3">Sélectionnez tous les connecteurs compatibles avec vos véhicules.</p>
              <div className="space-y-2">
                {CONNECTORS.map(c => {
                  const selected = form.connectors.includes(c);
                  return (
                    <button key={c} onClick={() => toggleConnector(c)}
                      className={`w-full text-left p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all
                        ${selected ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <Plug className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-primary' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium flex-1 ${selected ? 'text-primary' : 'text-gray-700'}`}>{CONNECTOR_LABELS[c]}</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${selected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                        {selected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {form.connectors.length === 0 && <p className="text-xs text-red-500 mt-2">Sélectionnez au moins un connecteur.</p>}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Nombre de points de charge</h2>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-primary hover:text-primary transition-all">−</button>
                <div className="w-20 h-10 rounded-xl border-2 border-primary bg-primary-light flex items-center justify-center font-bold text-primary text-lg">{form.quantity}</div>
                <button onClick={() => setForm(f => ({ ...f, quantity: f.quantity + 1 }))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-primary hover:text-primary transition-all">+</button>
                <span className="text-sm text-gray-500">borne{form.quantity > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 3 — Lieu & Parking ───────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Adresse d'installation</h2>
              <div className="space-y-3">
                <div>
                  <label className="label flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Adresse</label>
                  <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="12 rue des Lilas" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Code postal</label>
                    <input className="input" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} placeholder="75001" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="label">Ville</label>
                    <input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Paris" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <ParkingSquare className="w-5 h-5 text-primary" />Configuration du parking
              </h2>
              <p className="text-sm text-gray-500 mb-3">Ces informations permettent à l'installateur de préparer son intervention.</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Type d'espace</label>
                  <div className="grid grid-cols-1 gap-2">
                    {PARKING_TYPES.map(pt => (
                      <button key={pt} onClick={() => setForm(f => ({ ...f, parkingType: pt }))}
                        className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                          ${form.parkingType === pt ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                        {PARKING_TYPE_LABELS[pt]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Type d'accès</label>
                  <div className="grid grid-cols-1 gap-2">
                    {PARKING_ACCESS.map(pa => (
                      <button key={pa} onClick={() => setForm(f => ({ ...f, parkingAccess: pa }))}
                        className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                          ${form.parkingAccess === pa ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                        {PARKING_ACCESS_LABELS[pa]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Nombre d'emplacements de parking</label>
                  <input type="number" min="1" className="input w-32" value={form.parkingSpots}
                    onChange={e => setForm(f => ({ ...f, parkingSpots: Math.max(1, Number(e.target.value)) }))} />
                </div>
                <button onClick={() => setForm(f => ({ ...f, hasExistingPanel: !f.hasExistingPanel }))}
                  className={`w-full text-left p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all
                    ${form.hasExistingPanel ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                    ${form.hasExistingPanel ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                    {form.hasExistingPanel && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${form.hasExistingPanel ? 'text-primary' : 'text-gray-700'}`}>
                    Un tableau électrique existant est accessible à proximité
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="label">Informations complémentaires <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <textarea className="input resize-none" rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Contraintes d'accès, spécificités du site, questions particulières..." />
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 4 — Récapitulatif ────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Rappel installateur ciblé */}
            {isTargeted && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                <Shield className="w-4 h-4 flex-shrink-0 text-green-600" />
                <span>Demande ciblée → <strong>{installerName}</strong> uniquement. Un email lui sera envoyé dès l'envoi.</span>
              </div>
            )}

            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />Récapitulatif de votre demande
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Type de projet', value: PROJECT_TYPE_LABELS[form.projectType as ProjectType] },
                  { label: 'Puissance',       value: POWER_LEVEL_LABELS[form.powerLevel as PowerLevel] },
                  { label: 'Connecteurs',     value: form.connectors.map(c => CONNECTOR_LABELS[c].split(' ')[0]).join(', ') },
                  { label: 'Bornes',          value: `${form.quantity} point${form.quantity > 1 ? 's' : ''} de charge` },
                  { label: 'Adresse',         value: `${form.address}, ${form.postalCode} ${form.city}` },
                  { label: 'Parking',         value: form.parkingType ? PARKING_TYPE_LABELS[form.parkingType as ParkingType] : '—' },
                  { label: 'Accès',           value: form.parkingAccess ? PARKING_ACCESS_LABELS[form.parkingAccess as ParkingAccess] : '—' },
                  { label: 'Emplacements',    value: `${form.parkingSpots} place${form.parkingSpots > 1 ? 's' : ''}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-medium text-gray-800 text-xs">{value}</p>
                  </div>
                ))}
              </div>
              {form.description && (
                <div className="mt-3 bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-400 mb-0.5">Informations complémentaires</p>
                  <p className="text-sm text-gray-700">{form.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            className="btn-outline flex items-center gap-2 disabled:opacity-40">
            <ArrowLeft className="w-4 h-4" />Précédent
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="btn-primary flex items-center gap-2 disabled:opacity-40">
              Suivant<ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50">
              {loading
                ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Envoi...</>
                : <><CheckCircle className="w-4 h-4" />{isTargeted ? `Envoyer à ${installerName}` : 'Envoyer ma demande'}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}