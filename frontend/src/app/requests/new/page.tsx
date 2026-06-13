'use client';

import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle, ArrowLeft, ArrowRight, Building2, Camera, CheckCircle,
  FileText, Home, Hotel, Plug, Shield, Trash2, Upload, Users, Wrench, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { requestsApi } from '@/lib/api';
import {
  CONNECTOR_LABELS, PARKING_ACCESS_LABELS, PARKING_TYPE_LABELS,
  POWER_LEVEL_DESCRIPTIONS, POWER_LEVEL_LABELS, POWER_LEVEL_SHORT,
  PROJECT_TYPE_DESCRIPTIONS, PROJECT_TYPE_LABELS,
  type ConnectorType, type ParkingAccess, type ParkingType,
  type PowerLevel, type ProjectType,
} from '@/types';

type Reception4G = 'BONNE' | 'MOYENNE' | 'MEDIOCRE' | 'AUCUNE';
type MediaType =
  | 'ELECTRICAL_PANEL'
  | 'MAIN_BREAKER'
  | 'CHARGER_LOCATION'
  | 'CABLE_ROUTE'
  | 'INSTALLATION_PLAN'
  | 'CABLE_ROUTE_VIDEO'
  | 'OTHER';

type MediaItem = {
  id: string;
  type: MediaType;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  description: string;
  addedAt: string;
};

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
  contactPreference: string;
  desiredInstallDate: string;
  indicativeBudget: string;
  evModel: string;
  panelDistanceMeters: string;
  drillingCount: number;
  structuralDrillingCount: number;
  drillingThickness: string;
  reception4g: Reception4G | '';
  hasInternetBox: boolean | null;
  internetBoxDistanceMeters: string;
  mediaAttachments: MediaItem[];
}

const PROJECT_ICONS: Record<ProjectType, any> = {
  RESIDENTIAL: Home,
  COMMERCIAL: Building2,
  COPROPRIETE: Users,
  HOTEL: Hotel,
  SYNDIC: Users,
};
const CONNECTORS: ConnectorType[] = ['TYPE2_AC', 'CCS', 'CHADEMO'];
const POWER_LEVELS: PowerLevel[] = ['P1', 'P2', 'P3', 'P4'];
const PARKING_TYPES: ParkingType[] = ['INDOOR', 'OUTDOOR', 'SEMI_COVERED'];
const PARKING_ACCESS: ParkingAccess[] = ['PRIVATE', 'PUBLIC', 'MIXED'];
const RECEPTION_OPTIONS: Reception4G[] = ['BONNE', 'MOYENNE', 'MEDIOCRE', 'AUCUNE'];
const RECEPTION_LABELS: Record<Reception4G, string> = {
  BONNE: 'Bonne',
  MOYENNE: 'Moyenne',
  MEDIOCRE: 'Mediocre',
  AUCUNE: 'Aucune reception',
};
const MEDIA_LABELS: Record<MediaType, string> = {
  ELECTRICAL_PANEL: 'Tableau electrique',
  MAIN_BREAKER: 'Disjoncteur principal',
  CHARGER_LOCATION: 'Emplacement de la borne',
  CABLE_ROUTE: 'Cheminement du cable',
  INSTALLATION_PLAN: "Plan ou croquis de l'installation",
  CABLE_ROUTE_VIDEO: 'Video du parcours du cable',
  OTHER: 'Autre',
};
const MEDIA_TYPES = Object.keys(MEDIA_LABELS) as MediaType[];

const STEPS = [
  { id: 1, label: 'Projet' },
  { id: 2, label: 'Lieu' },
  { id: 3, label: 'Technique' },
  { id: 4, label: 'Photos' },
  { id: 5, label: 'Envoi' },
];

const INITIAL: FormData = {
  projectType: '',
  powerLevel: '',
  connectors: ['TYPE2_AC'],
  quantity: 1,
  address: '',
  city: '',
  postalCode: '',
  parkingType: '',
  parkingAccess: '',
  parkingSpots: 1,
  hasExistingPanel: false,
  description: '',
  contactPreference: 'EMAIL',
  desiredInstallDate: '',
  indicativeBudget: '',
  evModel: '',
  panelDistanceMeters: '',
  drillingCount: 0,
  structuralDrillingCount: 0,
  drillingThickness: '',
  reception4g: '',
  hasInternetBox: null,
  internetBoxDistanceMeters: '',
  mediaAttachments: [],
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function NewRequestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);

  const installerId = searchParams.get('installerId') || '';
  const installerName = searchParams.get('installerName') || '';
  const isTargeted = !!installerId;

  useEffect(() => {
    const u = localStorage.getItem('irve_user');
    if (!u) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [router]);

  const canNext = () => {
    if (step === 1) return !!form.projectType && !!form.powerLevel && form.connectors.length > 0;
    if (step === 2) return !!form.address.trim() && !!form.city.trim() && !!form.postalCode.trim() && !!form.parkingType && !!form.parkingAccess;
    if (step === 3) return !!form.reception4g && form.hasInternetBox !== null;
    return true;
  };

  const toggleConnector = (c: ConnectorType) => {
    setForm(f => ({
      ...f,
      connectors: f.connectors.includes(c) ? f.connectors.filter(x => x !== c) : [...f.connectors, c],
    }));
  };

  const addMedia = async (files: FileList | null, type: MediaType) => {
    if (!files?.length) return;
    const items = await Promise.all(Array.from(files).map(file => new Promise<MediaItem>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: `${Date.now()}-${file.name}`,
        type,
        fileName: file.name,
        mimeType: file.type,
        dataUrl: String(reader.result || ''),
        description: '',
        addedAt: new Date().toISOString(),
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    setForm(f => ({ ...f, mediaAttachments: [...f.mediaAttachments, ...items] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await requestsApi.create({
        projectType: form.projectType,
        powerLevel: form.powerLevel,
        connectors: form.connectors,
        quantity: form.quantity,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        parkingType: form.parkingType,
        parkingAccess: form.parkingAccess,
        parkingSpots: form.parkingSpots,
        hasExistingPanel: form.hasExistingPanel,
        description: form.description,
        contactPreference: form.contactPreference,
        desiredInstallDate: form.desiredInstallDate || undefined,
        indicativeBudget: toNumber(form.indicativeBudget),
        evModel: form.evModel,
        panelDistanceMeters: toNumber(form.panelDistanceMeters),
        drillingCount: form.drillingCount,
        structuralDrillingCount: form.structuralDrillingCount,
        drillingThickness: form.drillingThickness,
        reception4g: form.reception4g,
        hasInternetBox: form.hasInternetBox,
        internetBoxDistanceMeters: form.hasInternetBox ? toNumber(form.internetBoxDistanceMeters) : undefined,
        mediaAttachments: form.mediaAttachments,
        ...(installerId ? { targetInstallerId: installerId } : {}),
      });

      toast.success(isTargeted ? `Demande envoyee a ${installerName || "l'installateur"}.` : 'Demande envoyee.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi.");
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
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary">
          <ArrowLeft className="w-4 h-4" />Retour
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande d'installation</h1>
          {isTargeted ? (
            <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Demande envoyee uniquement a <strong>{installerName || 'cet installateur'}</strong>.</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Ajoutez les informations utiles pour obtenir un devis precis.</p>
          )}
        </div>

        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-200 text-gray-400'}`}>
                {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              <span className={`ml-2 text-xs font-medium whitespace-nowrap hidden sm:block ${step === s.id ? 'text-primary' : step > s.id ? 'text-green-600' : 'text-gray-400'}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-8 sm:w-12 mx-2 flex-shrink-0 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <section className="card space-y-6">
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Projet et borne</h2>
                <div className="grid grid-cols-1 gap-3">
                  {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map(type => {
                    const Icon = PROJECT_ICONS[type];
                    const selected = form.projectType === type;
                    return (
                      <button key={type} onClick={() => setForm(f => ({ ...f, projectType: type }))} className={`w-full text-left p-4 rounded-xl border-2 flex items-start gap-4 ${selected ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}><Icon className="w-5 h-5" /></div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-800">{PROJECT_TYPE_LABELS[type]}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{PROJECT_TYPE_DESCRIPTIONS[type]}</p>
                        </div>
                        {selected && <CheckCircle className="w-5 h-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Puissance souhaitee</h3>
                <div className="grid grid-cols-1 gap-3">
                  {POWER_LEVELS.map(level => (
                    <button key={level} onClick={() => setForm(f => ({ ...f, powerLevel: level }))} className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 ${form.powerLevel === level ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-700">{POWER_LEVEL_SHORT[level]}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-800">{POWER_LEVEL_LABELS[level]}</p>
                        <p className="text-xs text-gray-500">{POWER_LEVEL_DESCRIPTIONS[level]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Connecteurs</h3>
                <div className="space-y-2">
                  {CONNECTORS.map(c => (
                    <button key={c} onClick={() => toggleConnector(c)} className={`w-full text-left p-3 rounded-xl border-2 flex items-center gap-3 ${form.connectors.includes(c) ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white'}`}>
                      <Plug className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium flex-1">{CONNECTOR_LABELS[c]}</span>
                      {form.connectors.includes(c) && <CheckCircle className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nombre de points de charge">
                  <input type="number" min="1" className="input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))} />
                </Field>
                <Field label="Modele du vehicule electrique">
                  <input className="input" value={form.evModel} onChange={e => setForm(f => ({ ...f, evModel: e.target.value }))} placeholder="Ex : Tesla Model 3" />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-gray-800">Adresse et parking</h2>
              <Field label="Adresse complete">
                <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="12 rue des Lilas" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code postal">
                  <input className="input" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} inputMode="numeric" />
                </Field>
                <Field label="Ville">
                  <input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Type d'espace">
                  <select className="input" value={form.parkingType} onChange={e => setForm(f => ({ ...f, parkingType: e.target.value as ParkingType }))}>
                    <option value="">Selectionner</option>
                    {PARKING_TYPES.map(type => <option key={type} value={type}>{PARKING_TYPE_LABELS[type]}</option>)}
                  </select>
                </Field>
                <Field label="Type d'acces">
                  <select className="input" value={form.parkingAccess} onChange={e => setForm(f => ({ ...f, parkingAccess: e.target.value as ParkingAccess }))}>
                    <option value="">Selectionner</option>
                    {PARKING_ACCESS.map(type => <option key={type} value={type}>{PARKING_ACCESS_LABELS[type]}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nombre d'emplacements">
                  <input type="number" min="1" className="input" value={form.parkingSpots} onChange={e => setForm(f => ({ ...f, parkingSpots: Math.max(1, Number(e.target.value)) }))} />
                </Field>
                <Field label="Date souhaitee d'installation">
                  <input type="date" className="input" value={form.desiredInstallDate} onChange={e => setForm(f => ({ ...f, desiredInstallDate: e.target.value }))} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Budget indicatif">
                  <input type="number" min="0" step="50" className="input" value={form.indicativeBudget} onChange={e => setForm(f => ({ ...f, indicativeBudget: e.target.value }))} placeholder="Ex : 1200" />
                </Field>
                <Field label="Preference de contact">
                  <select className="input" value={form.contactPreference} onChange={e => setForm(f => ({ ...f, contactPreference: e.target.value }))}>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Telephone</option>
                    <option value="CHAT">Chat</option>
                  </select>
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" />Questionnaire technique</h2>
              <button onClick={() => setForm(f => ({ ...f, hasExistingPanel: !f.hasExistingPanel }))} className={`w-full text-left p-3.5 rounded-xl border-2 flex items-center gap-3 ${form.hasExistingPanel ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white'}`}>
                <CheckCircle className={`w-5 h-5 ${form.hasExistingPanel ? 'text-primary' : 'text-gray-300'}`} />
                <span className="text-sm font-medium">Tableau electrique accessible a proximite</span>
              </button>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Distance tableau / borne (m)">
                  <input type="number" min="0" step="0.5" className="input" value={form.panelDistanceMeters} onChange={e => setForm(f => ({ ...f, panelDistanceMeters: e.target.value }))} />
                </Field>
                <Field label="Nombre de percements">
                  <input type="number" min="0" className="input" value={form.drillingCount} onChange={e => setForm(f => ({ ...f, drillingCount: Math.max(0, Number(e.target.value)) }))} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Percements mur porteur / dalle beton">
                  <input type="number" min="0" className="input" value={form.structuralDrillingCount} onChange={e => setForm(f => ({ ...f, structuralDrillingCount: Math.max(0, Number(e.target.value)) }))} />
                </Field>
                <Field label="Epaisseur approximative a percer">
                  <input className="input" value={form.drillingThickness} onChange={e => setForm(f => ({ ...f, drillingThickness: e.target.value }))} placeholder="Ex : 20 cm, mur beton" />
                </Field>
              </div>
              <Field label="Qualite de reception 4G">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RECEPTION_OPTIONS.map(option => (
                    <button key={option} onClick={() => setForm(f => ({ ...f, reception4g: option }))} className={`px-3 py-2 rounded-lg border text-sm font-medium ${form.reception4g === option ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-700'}`}>{RECEPTION_LABELS[option]}</button>
                  ))}
                </div>
              </Field>
              <Field label="Possedez-vous une box internet ?">
                <div className="flex gap-2">
                  {[true, false].map(value => (
                    <button key={String(value)} onClick={() => setForm(f => ({ ...f, hasInternetBox: value }))} className={`px-5 py-2 rounded-lg border text-sm font-semibold ${form.hasInternetBox === value ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white'}`}>{value ? 'Oui' : 'Non'}</button>
                  ))}
                </div>
              </Field>
              {form.hasInternetBox && (
                <Field label="Distance box internet / future borne (m)">
                  <input type="number" min="0" step="0.5" className="input" value={form.internetBoxDistanceMeters} onChange={e => setForm(f => ({ ...f, internetBoxDistanceMeters: e.target.value }))} />
                </Field>
              )}
              <Field label="Description detaillee">
                <textarea className="input resize-none" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Contraintes d'acces, cheminement, attentes particulieres..." />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Camera className="w-5 h-5 text-primary" />Photos et videos</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {MEDIA_TYPES.map(type => (
                  <label key={type} className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-white hover:border-primary cursor-pointer">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-800"><Upload className="w-4 h-4 text-primary" />{MEDIA_LABELS[type]}</span>
                    <input className="hidden" type="file" multiple accept={type === 'CABLE_ROUTE_VIDEO' ? 'video/*' : 'image/*,application/pdf'} onChange={e => addMedia(e.target.files, type)} />
                  </label>
                ))}
              </div>
              {form.mediaAttachments.length === 0 ? (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 text-sm text-gray-500 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  Ajoutez au minimum les photos du tableau, du disjoncteur principal et de l'emplacement souhaite pour faciliter l'estimation.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {form.mediaAttachments.map(item => (
                    <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                      {item.mimeType.startsWith('image/') ? (
                        <img src={item.dataUrl} alt={item.fileName} className="w-full h-40 object-cover bg-gray-100" />
                      ) : (
                        <div className="h-40 bg-gray-50 flex items-center justify-center"><FileText className="w-8 h-8 text-gray-400" /></div>
                      )}
                      <div className="p-3 space-y-2">
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary">{MEDIA_LABELS[item.type]}</p>
                            <p className="text-sm font-medium text-gray-800 truncate">{item.fileName}</p>
                            <p className="text-xs text-gray-400">{new Date(item.addedAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <button onClick={() => setForm(f => ({ ...f, mediaAttachments: f.mediaAttachments.filter(x => x.id !== item.id) }))} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input className="input text-xs" value={item.description} onChange={e => setForm(f => ({ ...f, mediaAttachments: f.mediaAttachments.map(x => x.id === item.id ? { ...x, description: e.target.value } : x) }))} placeholder="Description facultative" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Recapitulatif</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ['Projet', form.projectType ? PROJECT_TYPE_LABELS[form.projectType] : '-'],
                  ['Puissance', form.powerLevel ? POWER_LEVEL_LABELS[form.powerLevel] : '-'],
                  ['Adresse', `${form.address}, ${form.postalCode} ${form.city}`],
                  ['Vehicule', form.evModel || '-'],
                  ['Distance tableau', form.panelDistanceMeters ? `${form.panelDistanceMeters} m` : '-'],
                  ['Percements', `${form.drillingCount} dont ${form.structuralDrillingCount} structurel(s)`],
                  ['4G', form.reception4g ? RECEPTION_LABELS[form.reception4g] : '-'],
                  ['Box internet', form.hasInternetBox ? `Oui, ${form.internetBoxDistanceMeters || '?'} m` : 'Non'],
                  ['Medias', `${form.mediaAttachments.length} piece(s)`],
                  ['Contact', form.contactPreference],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              {form.description && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{form.description}</p>}
            </>
          )}
        </section>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="btn-outline flex items-center gap-2 disabled:opacity-40">
            <ArrowLeft className="w-4 h-4" />Precedent
          </button>
          {step < 5 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn-primary flex items-center gap-2 disabled:opacity-40">
              Suivant<ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50">
              {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Envoi...</> : <><CheckCircle className="w-4 h-4" />Envoyer ma demande</>}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <NewRequestPageContent />
    </Suspense>
  );
}
