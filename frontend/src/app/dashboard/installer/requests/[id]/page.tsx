'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, CheckCircle, XCircle } from 'lucide-react';
import { requestsApi } from '@/lib/api';

const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise',
  COPROPRIETE: 'Copropriété', HOTEL: 'Hôtel', SYNDIC: 'Syndic',
};
const POWER_LABELS: Record<string, string> = {
  P1: '3,7 kW', P2: '7,4 kW', P3: '11 kW', P4: '22 kW', P5: '> 22 kW',
};
const URGENCY_LABELS: Record<string, string> = {
  normal: 'Normal', urgent: 'Urgent', flexible: 'Flexible',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function InstallerRequestDetailPage() {
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

    // Accepter → rediriger vers formulaire de devis
    if (action === 'ACCEPT') {
      router.push(`/dashboard/installer/quotes/new?requestId=${id}`);
      return;
    }

    // Décliner → appel API
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

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Demande d'installation IRVE</h1>
              <p className="text-sm text-gray-500">
                {request?.user?.firstName} {request?.user?.lastName} souhaite que vous installiez une borne de recharge.
              </p>
            </div>
          </div>
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
            request?.status === 'SUBMITTED'   ? 'bg-yellow-100 text-yellow-800' :
            request?.status === 'IN_PROGRESS' ? 'bg-blue-100   text-blue-800'  :
            request?.status === 'CANCELLED'   ? 'bg-red-100    text-red-700'   :
            request?.status === 'COMPLETED'   ? 'bg-green-100  text-green-800' :
            'bg-gray-100 text-gray-700'
          }`}>
            {request?.status === 'SUBMITTED'   ? 'En attente de réponse' :
             request?.status === 'IN_PROGRESS' ? 'En cours'             :
             request?.status === 'CANCELLED'   ? 'Déclinée / Annulée'   :
             request?.status === 'COMPLETED'   ? 'Terminée'             :
             request?.status}
          </span>
        </div>

        {/* Détails */}
        <div className="card">
          <h2 className="font-semibold mb-3 text-gray-700 text-sm">Détails de la demande</h2>
          <dl className="divide-y divide-gray-100">
            {[
              { label: 'Type de projet',      value: PROJ_LABELS[request?.projectType] || request?.projectType },
              { label: 'Puissance souhaitée', value: `${request?.powerLevel} — ${POWER_LABELS[request?.powerLevel] || ''}` },
              { label: 'Nb de bornes',        value: `${request?.quantity || 1} point(s) de charge` },
              { label: 'Adresse',             value: `${request?.address}, ${request?.postalCode} ${request?.city}` },
              { label: 'Urgence',             value: URGENCY_LABELS[request?.urgency] || request?.urgency || 'Normal' },
              ...(request?.hasExistingPanel ? [{ label: 'Tableau élec.', value: '✓ Disponible sur site' }] : []),
            ].map(row => (
              <div key={row.label} className="py-3 flex justify-between gap-4">
                <dt className="text-sm text-gray-500 shrink-0 w-44">{row.label}</dt>
                <dd className="text-sm font-semibold text-gray-800 text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
          {request?.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Remarques client</p>
              <p className="text-sm text-gray-700 italic">"{request.description}"</p>
            </div>
          )}
        </div>

        {/* Contact client */}
        {request?.user && (
          <div className="card">
            <h2 className="font-semibold mb-3 text-gray-700 text-sm">Contact client</h2>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
                {request.user.firstName?.[0]}{request.user.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {request.user.firstName} {request.user.lastName}
                </p>
                <p className="text-sm text-gray-500">{request.user.email}</p>
                {request.user.phone && <p className="text-sm text-gray-500">{request.user.phone}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Déjà traité */}
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

        {/* Formulaire de réponse */}
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
                : action === 'ACCEPT'  ? "Confirmer l'acceptation"
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