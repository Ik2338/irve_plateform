'use client';

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Camera, CheckCircle, Euro, FileText,
  Hash, MapPin, MessageCircle, Plug, Send, User, Video,
  Wrench, XCircle, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { requestsApi } from '@/lib/api';

const PROJECT_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier',
  COMMERCIAL: 'Entreprise',
  COPROPRIETE: 'Copropriete',
  HOTEL: 'Hotel',
  SYNDIC: 'Syndic',
};
const POWER_LABELS: Record<string, string> = {
  P1: '3,7 kW',
  P2: '7,4 kW',
  P3: '11 kW',
  P4: '22 kW',
  P5: '> 22 kW',
};
const CONNECTOR_LABELS: Record<string, string> = {
  TYPE2_AC: 'Type 2 AC',
  CCS: 'CCS Combo 2',
  CHADEMO: 'CHAdeMO',
};
const PARKING_TYPE_LABELS: Record<string, string> = {
  INDOOR: 'Parking couvert / sous-sol',
  OUTDOOR: 'Parking exterieur',
  SEMI_COVERED: 'Semi-couvert',
};
const PARKING_ACCESS_LABELS: Record<string, string> = {
  PRIVATE: 'Acces prive',
  PUBLIC: 'Acces public',
  MIXED: 'Acces mixte',
};
const RECEPTION_LABELS: Record<string, string> = {
  BONNE: 'Bonne',
  MOYENNE: 'Moyenne',
  MEDIOCRE: 'Mediocre',
  AUCUNE: 'Aucune reception',
};
const MEDIA_LABELS: Record<string, string> = {
  ELECTRICAL_PANEL: 'Tableau electrique',
  MAIN_BREAKER: 'Disjoncteur principal',
  CHARGER_LOCATION: 'Emplacement de la borne',
  CABLE_ROUTE: 'Cheminement du cable',
  INSTALLATION_PLAN: "Plan ou croquis de l'installation",
  CABLE_ROUTE_VIDEO: 'Video du parcours du cable',
  OTHER: 'Autre',
};
const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'En attente',
  MATCHED: 'Matchee',
  IN_PROGRESS: 'En cours',
  QUOTE_SENT: 'Devis envoye',
  QUOTE_ACCEPTED: 'Devis accepte',
  INSTALLATION: 'Installation',
  MISE_EN_SERVICE: 'Mise en service',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDate(value?: string, withTime = false) {
  if (!value) return '-';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function money(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-';
  return `${Number(value).toLocaleString('fr-FR')} EUR`;
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) {
  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0 flex justify-between gap-4">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm font-semibold text-gray-800 text-right break-words">{value || <span className="text-gray-300 font-normal">-</span>}</dd>
    </div>
  );
}

function InstallerRequestDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (!id || !UUID_RE.test(id)) return;
    requestsApi.getOne(id)
      .then(({ data }) => setRequest(data))
      .catch((err: any) => {
        toast.error(err?.response?.data?.message || 'Demande introuvable.');
        router.push('/dashboard/installer');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const conversation = request?.conversations?.[0];
  const messages = conversation?.messages ?? [];
  const media = request?.mediaAttachments ?? [];
  const fullAddress = `${request?.address ?? ''}, ${request?.postalCode ?? ''} ${request?.city ?? ''}`.trim();

  const canDecline = request?.status === 'SUBMITTED' && request?.targetInstallerId;
  const canQuote = request && request.status !== 'CANCELLED' && request.status !== 'COMPLETED';

  const technicalRows = useMemo(() => [
    ['Modele vehicule', request?.evModel],
    ['Distance tableau / borne', request?.panelDistanceMeters ? `${request.panelDistanceMeters} m` : null],
    ['Percements a prevoir', request?.drillingCount ?? 0],
    ['Percements mur porteur / dalle', request?.structuralDrillingCount ?? 0],
    ['Epaisseur approximative', request?.drillingThickness],
    ['Reception 4G', request?.reception4g ? RECEPTION_LABELS[request.reception4g] : null],
    ['Box internet', request?.hasInternetBox === true ? 'Oui' : request?.hasInternetBox === false ? 'Non' : null],
    ['Distance box / borne', request?.internetBoxDistanceMeters ? `${request.internetBoxDistanceMeters} m` : null],
  ], [request]);

  const decline = async () => {
    if (!request?.id) return;
    setDeclining(true);
    try {
      await requestsApi.respond(request.id, 'DECLINE');
      toast.success('Demande declinee.');
      router.push('/dashboard/installer');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du refus.');
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        <Link href="/dashboard/installer" className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary">
          <ArrowLeft className="w-4 h-4" />Tableau de bord
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="card mb-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="badge-blue">{STATUS_LABELS[request.status] ?? request.status}</span>
                <span className="badge-orange">{PROJECT_LABELS[request.projectType] ?? request.projectType}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{POWER_LABELS[request.powerLevel] ?? request.powerLevel}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Demande d'installation IRVE</h1>
              <p className="text-sm text-gray-500 mt-1">{fullAddress}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Creee le {formatDate(request.createdAt)}</span>
                <span className="inline-flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{request.id}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {conversation?.id && (
                <Link href={`/messages/${conversation.id}`} className="btn-primary inline-flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />Contacter le client
                </Link>
              )}
              {canQuote && (
                <Link href={`/dashboard/installer/quotes/new?requestId=${request.id}`} className="btn-outline inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" />Etablir un devis
                </Link>
              )}
              {canDecline && (
                <button onClick={decline} disabled={declining} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                  <XCircle className="w-4 h-4" />Refuser
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Section icon={User} title="Informations client">
            <dl>
              <Info label="Nom complet" value={`${request.user?.firstName ?? ''} ${request.user?.lastName ?? ''}`.trim()} />
              <Info label="Adresse e-mail" value={request.user?.email ? <a className="text-primary hover:underline" href={`mailto:${request.user.email}`}>{request.user.email}</a> : null} />
              <Info label="Telephone" value={request.user?.phone ? <a className="text-primary hover:underline" href={`tel:${request.user.phone}`}>{request.user.phone}</a> : null} />
              <Info label="Adresse complete" value={request.address} />
              <Info label="Ville" value={request.city} />
              <Info label="Code postal" value={request.postalCode} />
              <Info label="Date de creation" value={formatDate(request.createdAt, true)} />
              <Info label="Preference contact" value={request.contactPreference} />
            </dl>
          </Section>

          <Section icon={Wrench} title="Informations projet">
            <dl>
              <Info label="Type de projet" value={PROJECT_LABELS[request.projectType] ?? request.projectType} />
              <Info label="Puissance" value={POWER_LABELS[request.powerLevel] ?? request.powerLevel} />
              <Info label="Connecteurs" value={request.connectors?.length ? request.connectors.map((c: string) => CONNECTOR_LABELS[c] ?? c).join(', ') : null} />
              <Info label="Nombre de bornes" value={request.quantity} />
              <Info label="Date souhaitee" value={formatDate(request.desiredInstallDate)} />
              <Info label="Budget indicatif" value={money(request.indicativeBudget)} />
              <Info label="Statut" value={STATUS_LABELS[request.status] ?? request.status} />
              <Info label="Parking" value={request.parkingType ? PARKING_TYPE_LABELS[request.parkingType] : null} />
              <Info label="Acces parking" value={request.parkingAccess ? PARKING_ACCESS_LABELS[request.parkingAccess] : null} />
            </dl>
            {request.description && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{request.description}</div>
            )}
            <a href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <MapPin className="w-3.5 h-3.5" />Voir sur Google Maps
            </a>
          </Section>

          <Section icon={Plug} title="Questionnaire technique">
            <dl>
              <Info label="Tableau accessible" value={request.hasExistingPanel ? <span className="text-green-600 inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Oui</span> : 'Non / inconnu'} />
              {technicalRows.map(([label, value]: any) => <Info key={label} label={label} value={value} />)}
            </dl>
          </Section>

          <Section icon={MessageCircle} title="Historique des messages">
            {messages.length ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {messages.map((message: any) => (
                  <div key={message.id} className="rounded-xl bg-gray-50 p-3">
                    <div className="flex justify-between gap-3 text-xs text-gray-400 mb-1">
                      <span className="font-semibold text-gray-700">{message.sender?.firstName} {message.sender?.lastName}</span>
                      <span>{formatDate(message.createdAt, true)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.body}</p>
                    {message.attachments?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.attachments.map((file: any, index: number) => (
                          <a key={`${file.fileName}-${index}`} href={file.dataUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary bg-white border border-gray-100 rounded-lg px-2 py-1">
                            <FileText className="w-3 h-3" />{file.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-500">
                Aucun message pour le moment. Utilisez le chat pour poser vos questions avant le devis.
              </div>
            )}
          </Section>
        </div>

        <Section icon={Camera} title="Galerie photos / videos">
          {media.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map((item: any, index: number) => {
                const isImage = item.mimeType?.startsWith('image/');
                const isVideo = item.mimeType?.startsWith('video/');
                return (
                  <article key={`${item.fileName}-${index}`} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                    {isImage ? (
                      <img src={item.dataUrl} alt={item.fileName} className="w-full h-48 object-cover bg-gray-100" />
                    ) : isVideo ? (
                      <video src={item.dataUrl} controls className="w-full h-48 bg-black" />
                    ) : (
                      <div className="h-48 bg-gray-50 flex items-center justify-center">
                        {isVideo ? <Video className="w-8 h-8 text-gray-400" /> : <FileText className="w-8 h-8 text-gray-400" />}
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold text-primary">{MEDIA_LABELS[item.type] ?? item.type}</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.fileName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Ajoute le {formatDate(item.addedAt)}</p>
                      {item.description && <p className="text-sm text-gray-600 mt-2">{item.description}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-500">Aucune photo ou piece jointe fournie.</div>
          )}
        </Section>

        <div className="sticky bottom-0 mt-6 bg-white/95 backdrop-blur border rounded-xl shadow-sm px-4 py-3 flex flex-wrap justify-end gap-2">
          {conversation?.id && (
            <Link href={`/messages/${conversation.id}`} className="btn-primary inline-flex items-center gap-2">
              <Send className="w-4 h-4" />Contacter le client
            </Link>
          )}
          {canQuote && (
            <Link href={`/dashboard/installer/quotes/new?requestId=${request.id}`} className="btn-outline inline-flex items-center gap-2">
              <Euro className="w-4 h-4" />Etablir un devis
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InstallerRequestDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <InstallerRequestDetailContent />
    </Suspense>
  );
}
