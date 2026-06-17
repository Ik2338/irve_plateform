'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, CheckCircle, Clock, XCircle, User, MapPin, Euro, Wrench, FlagTriangleRight } from 'lucide-react';
import { quotesApi, requestsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise',
  COPROPRIETE: 'Copropriété', HOTEL: 'Hôtel', SYNDIC: 'Syndic',
};
const POWER_LABELS: Record<string, string> = {
  P1: '3,7 kW', P2: '7,4 kW', P3: '11 kW', P4: '22 kW', P5: '> 22 kW',
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface QuoteUser {
  firstName?: string;
  lastName?:  string;
  email?:     string;
  phone?:     string;
}

interface QuoteRequest {
  id:          string;
  status:      string;
  projectType: string;
  powerLevel:  string;
  address?:    string;
  city?:       string;
  user?:       QuoteUser;
}

interface QuoteInstaller {
  companyName?: string;
  city?:        string;
}

interface Quote {
  id:           string;
  status:       string;
  createdAt:    string;
  validUntil?:  string;
  laborCost?:   number;
  // materialCost?: number;
  notes?:       string;
  installer?:   QuoteInstaller;
  request?:     QuoteRequest;
}

export default function InstallerQuoteDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : undefined;

  const [quote,    setQuote]    = useState<Quote | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [updating, setUpdating] = useState(false);
  // Local copy of request status so UI updates instantly after action
  const [reqStatus, setReqStatus] = useState<string>('');

  if (!id || !UUID_RE.test(id)) return null;

  useEffect(() => {
    setLoading(true);
    quotesApi.getOneForInstaller(id)
      .then(({ data }: { data: Quote }) => {
        setQuote(data);
        setReqStatus(data.request?.status ?? '');
      })
      .catch((err: any) => setError(
        err?.response?.data?.message || err?.message || 'Devis introuvable ou accès refusé.',
      ))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Mise à jour du statut de la demande ────────────────────────────────────
  const updateInstallationStatus = async (newStatus: 'INSTALLATION' | 'COMPLETED') => {
    if (!quote?.request?.id) return;
    setUpdating(true);
    try {
      await requestsApi.updateStatus(quote.request.id, newStatus);
      setReqStatus(newStatus);
      toast.success(
        newStatus === 'INSTALLATION'
          ? 'Installation démarrée !'
          : 'Installation marquée comme terminée !'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4">
      <div className="card max-w-sm w-full text-center py-10 space-y-3">
        <p className="text-red-600 font-medium">{error}</p>
        <Link href="/dashboard/installer" className="btn-outline text-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />Retour au tableau de bord
        </Link>
      </div>
    </div>
  );

  if (!quote) return null;

  const quoteAmount = quote.laborCost ?? 0;

  const statusConfig: Record<string, { label: string; color: string; Icon: any }> = {
    SENT:     { label: 'En attente',  color: 'bg-orange-100 text-orange-700', Icon: Clock       },
    ACCEPTED: { label: 'Accepté',     color: 'bg-green-100  text-green-700',  Icon: CheckCircle },
    REFUSED:  { label: 'Refusé',      color: 'bg-red-100    text-red-700',    Icon: XCircle     },
  };
  const quoteStatus = statusConfig[quote.status] ?? { label: quote.status, color: 'bg-gray-100 text-gray-700', Icon: Clock };

  const showInstallationBlock = quote.status === 'ACCEPTED';

  const installationStep =
    reqStatus === 'COMPLETED'    ? 'done'    :
    reqStatus === 'INSTALLATION' ? 'ongoing' :
    'pending';

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

        {/* ── Header ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Détail du devis</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${quoteStatus.color}`}>
              <quoteStatus.Icon className="w-3.5 h-3.5" />
              {quoteStatus.label}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Envoyé le {new Date(quote.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {quote.validUntil && (
              <> · Valable jusqu'au {new Date(quote.validUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
            )}
          </p>
        </div>

        {/* ── Suivi de l'installation ─────────────────────────────────────── */}
        {showInstallationBlock && (
          <div className={`card border-2 ${
            installationStep === 'done'    ? 'border-green-200 bg-green-50'  :
            installationStep === 'ongoing' ? 'border-blue-200  bg-blue-50'   :
            'border-gray-200'
          }`}>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              Suivi de l'installation
            </h2>

            {/* Stepper visuel */}
            <div className="flex items-center gap-2 mb-5">
              {[
                { key: 'pending', label: 'Devis accepté'   },
                { key: 'ongoing', label: 'En installation' },
                { key: 'done',    label: 'Terminée'        },
              ].map((step, i, arr) => {
                const reached =
                  (step.key === 'pending')                                                    ||
                  (step.key === 'ongoing' && ['ongoing', 'done'].includes(installationStep))  ||
                  (step.key === 'done'    && installationStep === 'done');
                const active = step.key === installationStep;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1 gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        reached
                          ? active
                            ? 'bg-primary text-white ring-4 ring-primary/20'
                            : 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {reached && !active ? '✓' : i + 1}
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight ${
                        active ? 'text-primary' : reached ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`h-0.5 w-8 flex-shrink-0 -mt-4 mx-1 ${
                        ['ongoing', 'done'].includes(installationStep) && i === 0 ? 'bg-green-400' :
                        installationStep === 'done' && i === 1                    ? 'bg-green-400' :
                        'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Boutons d'action */}
            {installationStep === 'pending' && (
              <button
                onClick={() => updateInstallationStatus('INSTALLATION')}
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <Wrench className="w-4 h-4" />
                {updating ? 'Mise à jour…' : "Démarrer l'installation"}
              </button>
            )}

            {installationStep === 'ongoing' && (
              <button
                onClick={() => updateInstallationStatus('COMPLETED')}
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <FlagTriangleRight className="w-4 h-4" />
                {updating ? 'Mise à jour…' : "Marquer comme terminée"}
              </button>
            )}

            {installationStep === 'done' && (
              <div className="flex items-center justify-center gap-2 text-green-700 font-semibold text-sm py-2">
                <CheckCircle className="w-5 h-5" />
                Installation terminée — dossier clôturé
              </div>
            )}
          </div>
        )}

        {/* ── Récapitulatif financier ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Euro className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-gray-900">Récapitulatif du devis</h2>
          </div>
          <dl className="divide-y divide-gray-100">
            {[
              { label: 'Installateur',   value: quote.installer?.companyName ?? '—' },
              { label: 'Type de projet', value: PROJ_LABELS[quote.request?.projectType ?? ''] ?? quote.request?.projectType ?? '—' },
              { label: "Montant du devis",   value: `${quoteAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` },
              // { label: 'Matériel',       value: `${(quote.materialCost ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` },
            ].map(row => (
              <div key={row.label} className="py-3 flex justify-between gap-4">
                <dt className="text-sm text-gray-500">{row.label}</dt>
                <dd className="text-sm font-semibold text-gray-800">{row.value}</dd>
              </div>
            ))}
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-base font-bold text-gray-900">Montant du devis</dt>
              <dd className="text-base font-bold text-primary">
                {quoteAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </dd>
            </div>
          </dl>
          {quote.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-700 italic">"{quote.notes}"</p>
            </div>
          )}
        </div>

        {/* ── Demande associée ── */}
        {quote.request && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-gray-900">Demande associée</h2>
            </div>
            <dl className="divide-y divide-gray-100">
              {[
                { label: 'Type de projet', value: PROJ_LABELS[quote.request.projectType] ?? quote.request.projectType },
                { label: 'Puissance',      value: `${quote.request.powerLevel} — ${POWER_LABELS[quote.request.powerLevel] ?? ''}` },
                { label: 'Adresse',        value: `${quote.request.address ?? ''}, ${quote.request.city ?? ''}` },
              ].map(row => (
                <div key={row.label} className="py-3 flex justify-between gap-4">
                  <dt className="text-sm text-gray-500 shrink-0 w-40">{row.label}</dt>
                  <dd className="text-sm font-semibold text-gray-800 text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* ── Infos client ── */}
        {quote.request?.user && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-gray-900">Client</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {quote.request.user.firstName?.[0]}{quote.request.user.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {quote.request.user.firstName} {quote.request.user.lastName}
                </p>
                <p className="text-sm text-gray-500">{quote.request.user.email}</p>
                {quote.request.user.phone && (
                  <p className="text-sm text-gray-500">{quote.request.user.phone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Devis refusé ── */}
        {quote.status === 'REFUSED' && (
          <div className="card border-red-200 bg-red-50 text-center py-6 space-y-2">
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-red-800 font-semibold">Ce devis a été refusé par le client.</p>
          </div>
        )}

      </div>
    </div>
  );
}
