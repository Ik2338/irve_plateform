'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Zap, CheckCircle, XCircle, MapPin, Plug, ParkingSquare,
  User, Mail, Phone, Calendar, Clock, Layers, Battery, Info,
  Building2, Home, Hotel, Users, Hash, Gauge, Tag, FileText,
  ShieldCheck, Wrench, AlertCircle,
} from 'lucide-react';
import { requestsApi } from '@/lib/api';

/* ─── Labels ─────────────────────────────────────────────────────────────── */
const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise',
  COPROPRIETE: 'Copropriété', HOTEL: 'Hôtel', SYNDIC: 'Syndic',
};
const PROJ_ICONS: Record<string, any> = {
  RESIDENTIAL: Home, COMMERCIAL: Building2, COPROPRIETE: Users,
  HOTEL: Hotel, SYNDIC: Users,
};
const POWER_LABELS: Record<string, string> = {
  P1: '3,7 kW — Charge lente (nuit)',
  P2: '7,4 kW — Charge standard',
  P3: '11 kW — Charge accélérée',
  P4: '22 kW — Charge rapide AC',
  P5: '> 22 kW — Charge très rapide',
};
const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  normal:   { label: 'Normal',   color: 'bg-blue-100 text-blue-700' },
  urgent:   { label: 'Urgent',   color: 'bg-red-100 text-red-700' },
  flexible: { label: 'Flexible', color: 'bg-gray-100 text-gray-600' },
};
const CONNECTOR_LABELS: Record<string, string> = {
  TYPE2_AC: 'Type 2 AC (standard EU)',
  CCS:      'CCS Combo 2 (charge rapide DC)',
  CHADEMO:  'CHAdeMO (Nissan / Mitsubishi)',
};
const PARKING_TYPE_LABELS: Record<string, string> = {
  INDOOR:       'Parking couvert / sous-sol',
  OUTDOOR:      'Parking extérieur',
  SEMI_COVERED: 'Semi-couvert',
};
const PARKING_ACCESS_LABELS: Record<string, string> = {
  PRIVATE: 'Accès privé',
  PUBLIC:  'Accès public',
  MIXED:   'Accès mixte',
};
const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  DIRECT: { label: 'Demande directe', color: 'bg-green-100 text-green-700' },
  ZONE:   { label: 'Par zone',        color: 'bg-purple-100 text-purple-700' },
};
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUBMITTED:   { label: 'En attente de réponse', color: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'En cours',              color: 'bg-blue-100 text-blue-800' },
  CANCELLED:   { label: 'Déclinée / Annulée',    color: 'bg-red-100 text-red-700' },
  COMPLETED:   { label: 'Terminée',              color: 'bg-green-100 text-green-800' },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ─── Small helpers ───────────────────────────────────────────────────────── */
function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="py-2.5 flex justify-between items-start gap-4 border-b border-gray-50 last:border-0">
      <dt className="text-sm text-gray-400 shrink-0 w-44">{label}</dt>
      <dd className={`text-sm font-semibold text-gray-800 text-right ${mono ? 'font-mono' : ''}`}>{value ?? <span className="text-gray-300 font-normal italic">—</span>}</dd>
    </div>
  );
}

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${colorClass}`}>{text}</span>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
function InstallerRequestDetailPageContent() {
  const params       = useParams();
  const id           = typeof params?.id === 'string' ? params.id : undefined;
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [request,    setRequest]    = useState<any>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [note,       setNote]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState<'ACCEPT' | 'DECLINE' | null>(null);

  const urlAction = searchParams.get('action');
  const [action, setAction] = useState<'ACCEPT' | 'DECLINE' | null>(
    urlAction === 'accept' ? 'ACCEPT' : urlAction === 'decline' ? 'DECLINE' : null,
  );

  if (!id || !UUID_RE.test(id)) return null;

  useEffect(() => {
    setLoading(true);
    requestsApi.getOne(id)
      .then(({ data }) => setRequest(data))
      .catch((err: any) => setError(
        err?.response?.data?.message || err?.message || 'Demande introuvable ou accès refusé.',
      ))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!action || !id) return;
    if (action === 'ACCEPT') {
      router.push(`/dashboard/installer/quotes/new?requestId=${id}`);
      return;
    }
    setSubmitting(true);
    try {
      await requestsApi.respond(id, action, note || undefined);
      setDone(action);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── States ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (error && !request) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4">
      <div className="card max-w-sm w-full text-center py-10 space-y-3">
        <p className="text-red-600 font-medium">{error}</p>
        <Link href="/dashboard/installer" className="btn-outline text-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />Retour au tableau de bord
        </Link>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full text-center py-10 space-y-4">
        {done === 'ACCEPT'
          ? <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
          : <XCircle     className="w-14 h-14 text-red-400   mx-auto" />}
        <h2 className="text-xl font-bold text-gray-800">
          {done === 'ACCEPT' ? 'Demande acceptée !' : 'Demande déclinée'}
        </h2>
        <p className="text-sm text-gray-500">
          {done === 'ACCEPT'
            ? 'Le client a été notifié. Vous pouvez maintenant lui envoyer un devis.'
            : 'Le client a été notifié. La demande est clôturée.'}
        </p>
        <Link href="/dashboard/installer" className="btn-primary inline-flex items-center gap-2 justify-center">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );

  const isAlreadyHandled = request?.status && request.status !== 'SUBMITTED';
  const status  = STATUS_CONFIG[request?.status] ?? { label: request?.status, color: 'bg-gray-100 text-gray-700' };
  const urgency = URGENCY_LABELS[request?.urgency] ?? { label: request?.urgency ?? 'Normal', color: 'bg-gray-100 text-gray-600' };
  const source  = SOURCE_LABELS[request?.source]  ?? null;
  const ProjIcon = PROJ_ICONS[request?.projectType] ?? Wrench;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        <Link href="/dashboard/installer" className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary">
          <ArrowLeft className="w-4 h-4" />Tableau de bord
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* ── Hero Header ── */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">Demande d'installation IRVE</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {request?.user?.firstName} {request?.user?.lastName} souhaite que vous installiez une borne de recharge.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge text={status.label} colorClass={status.color} />
                <Badge text={urgency.label} colorClass={urgency.color} />
                {source && <Badge text={source.label} colorClass={source.color} />}
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-400">
            {request?.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Créée le {new Date(request.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
            {request?.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Mise à jour {new Date(request.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
              </div>
            )}
            {request?.id && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Hash className="w-3.5 h-3.5" />
                <span className="font-mono">{request.id}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Projet ── */}
        <div className="card">
          <SectionTitle icon={Wrench} title="Type de projet" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <ProjIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {PROJ_LABELS[request?.projectType] ?? request?.projectType}
              </p>
              {request?.projectType === 'SYNDIC' && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" />Vote en assemblée générale requis
                </p>
              )}
            </div>
          </div>
          <dl>
            <InfoRow label="Puissance souhaitée"  value={POWER_LABELS[request?.powerLevel] ?? request?.powerLevel} />
            <InfoRow label="Code puissance"        value={request?.powerLevel} mono />
            <InfoRow label="Nb de points de charge" value={`${request?.quantity ?? 1} borne${(request?.quantity ?? 1) > 1 ? 's' : ''}`} />
            <InfoRow label="Urgence"               value={<Badge text={urgency.label} colorClass={urgency.color} />} />
          </dl>
        </div>

        {/* ── Connecteurs ── */}
        {request?.connectors?.length > 0 && (
          <div className="card">
            <SectionTitle icon={Plug} title="Normes de connexion" />
            <div className="space-y-2">
              {request.connectors.map((c: string) => (
                <div key={c} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                  <Plug className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{CONNECTOR_LABELS[c] ?? c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Lieu & Adresse ── */}
        <div className="card">
          <SectionTitle icon={MapPin} title="Lieu d'installation" />
          <dl>
            <InfoRow label="Adresse"      value={request?.address} />
            <InfoRow label="Code postal"  value={request?.postalCode} mono />
            <InfoRow label="Ville"        value={request?.city} />
          </dl>
          {request?.address && request?.city && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`${request.address}, ${request.postalCode} ${request.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
            >
              <MapPin className="w-3.5 h-3.5" />Voir sur Google Maps
            </a>
          )}
        </div>

        {/* ── Parking ── */}
        <div className="card">
          <SectionTitle icon={ParkingSquare} title="Configuration du parking" />
          <dl>
            <InfoRow label="Type d'espace"        value={request?.parkingType   ? PARKING_TYPE_LABELS[request.parkingType]     : null} />
            <InfoRow label="Type d'accès"          value={request?.parkingAccess ? PARKING_ACCESS_LABELS[request.parkingAccess] : null} />
            <InfoRow label="Nb d'emplacements"     value={request?.parkingSpots ? `${request.parkingSpots} place${request.parkingSpots > 1 ? 's' : ''}` : null} />
            <InfoRow
              label="Tableau électrique"
              value={
                request?.hasExistingPanel != null
                  ? request.hasExistingPanel
                    ? <span className="text-green-600 flex items-center justify-end gap-1"><CheckCircle className="w-3.5 h-3.5" />Disponible sur site</span>
                    : <span className="text-gray-400">Non disponible / Inconnu</span>
                  : null
              }
            />
          </dl>
        </div>

        {/* ── Remarques ── */}
        {request?.description && (
          <div className="card">
            <SectionTitle icon={FileText} title="Remarques du client" />
            <blockquote className="border-l-4 border-primary pl-4 text-sm text-gray-700 italic leading-relaxed">
              "{request.description}"
            </blockquote>
          </div>
        )}

        {/* ── Informations techniques complémentaires ── */}
        {(request?.source || request?.targetInstallerId) && (
          <div className="card">
            <SectionTitle icon={Info} title="Informations techniques" />
            <dl>
              <InfoRow label="Source de la demande" value={source ? <Badge text={source.label} colorClass={source.color} /> : request?.source} />
              {request?.targetInstallerId && (
                <InfoRow label="Installateur ciblé" value={<span className="font-mono text-xs">{request.targetInstallerId}</span>} />
              )}
            </dl>
          </div>
        )}

        {/* ── Contact client (COMPLET) ── */}
        {request?.user && (
          <div className="card border-primary/20 bg-gradient-to-br from-white to-primary-light/30">
            <SectionTitle icon={User} title="Contact client — informations complètes" />

            {/* Avatar + nom */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                {request.user.firstName?.[0]}{request.user.lastName?.[0]}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {request.user.firstName} {request.user.lastName}
                </p>
                {request.user.role && (
                  <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mt-1">
                    {request.user.role === 'CLIENT' ? 'Client' : request.user.role}
                  </span>
                )}
              </div>
            </div>

            <dl>
              <InfoRow
                label="Email"
                value={
                  <a href={`mailto:${request.user.email}`} className="text-primary hover:underline flex items-center gap-1 justify-end">
                    <Mail className="w-3.5 h-3.5" />{request.user.email}
                  </a>
                }
              />
              <InfoRow
                label="Téléphone"
                value={
                  request.user.phone
                    ? <a href={`tel:${request.user.phone}`} className="text-primary hover:underline flex items-center gap-1 justify-end">
                        <Phone className="w-3.5 h-3.5" />{request.user.phone}
                      </a>
                    : <span className="text-gray-300 italic font-normal">Non renseigné</span>
                }
              />
              {request.user.createdAt && (
                <InfoRow
                  label="Membre depuis"
                  value={new Date(request.user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                />
              )}
              {request.user.id && (
                <InfoRow label="ID utilisateur" value={<span className="font-mono text-xs">{request.user.id}</span>} />
              )}
            </dl>

            {/* Actions rapides */}
            <div className="mt-4 pt-4 border-t border-primary/10 flex flex-wrap gap-2">
              <a href={`mailto:${request.user.email}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg transition-colors">
                <Mail className="w-3.5 h-3.5" />Envoyer un email
              </a>
              {request.user.phone && (
                <a href={`tel:${request.user.phone}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-white hover:bg-primary-light px-3 py-2 rounded-lg transition-colors">
                  <Phone className="w-3.5 h-3.5" />Appeler
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Déjà traité ── */}
        {isAlreadyHandled && (
          <div className="card border-amber-200 bg-amber-50 text-center py-6 space-y-2">
            <p className="text-amber-800 font-semibold text-sm">
              Cette demande a déjà été traitée ({request.status}).
            </p>
            <Link href="/dashboard/installer" className="btn-outline text-sm inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />Retour au tableau de bord
            </Link>
          </div>
        )}

        {/* ── Formulaire de réponse ── */}
        {!isAlreadyHandled && (
          <div className="card space-y-5">
            <h2 className="font-semibold text-gray-700 text-sm">Votre réponse</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAction('ACCEPT')}
                className={`py-3 rounded-xl font-semibold text-sm border-2 transition ${
                  action === 'ACCEPT'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-400'
                }`}
              >
                ✓ Accepter
              </button>
              <button
                onClick={() => setAction('DECLINE')}
                className={`py-3 rounded-xl font-semibold text-sm border-2 transition ${
                  action === 'DECLINE'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
                }`}
              >
                ✕ Décliner
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message au client <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={
                  action === 'ACCEPT'  ? 'Ex : Je serai disponible dès la semaine prochaine…' :
                  action === 'DECLINE' ? 'Ex : Je ne suis pas disponible dans ce secteur…'    :
                  'Sélectionnez une action ci-dessus…'
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!action || submitting}
              className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                !action || submitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : action === 'ACCEPT'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {submitting
                ? 'Envoi en cours…'
                : action === 'ACCEPT'  ? "Confirmer l'acceptation → Créer un devis"
                : action === 'DECLINE' ? 'Confirmer le refus'
                : 'Choisissez une action'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Cette demande vous a été envoyée directement. Elle n'est visible par aucun autre installateur.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function InstallerRequestDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <InstallerRequestDetailPageContent />
    </Suspense>
  );
}
