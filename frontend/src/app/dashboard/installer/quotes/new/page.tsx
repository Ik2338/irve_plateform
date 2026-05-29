'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Zap, Send, User, MapPin, Euro,
  Wrench, Calendar, Home, Building2, Hotel,
  Users, FileText, Zap as ZapIcon,
} from 'lucide-react';
import { requestsApi, quotesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier',
  COMMERCIAL:  'Entreprise',
  COPROPRIETE: 'Copropriété',
  HOTEL:       'Hôtel',
  SYNDIC:      'Syndic',
};

const PROJ_ICONS: Record<string, any> = {
  RESIDENTIAL: Home,
  COMMERCIAL:  Building2,
  COPROPRIETE: Users,
  HOTEL:       Hotel,
  SYNDIC:      Users,
};

const POWER_LABELS: Record<string, string> = {
  P1: '3,7 kW',
  P2: '7,4 kW',
  P3: '11 kW',
  P4: '22 kW',
  P5: '> 22 kW',
};

const VAT_RATE = 20;

export default function NewQuotePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const requestId = searchParams.get('requestId') ?? undefined;

  const [request,    setRequest]    = useState<any>(null);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const [form, setForm] = useState({
    laborCost:   '',
    description: '',
    validUntil:  '',
  });

  useEffect(() => {
    if (!requestId || !UUID_RE.test(requestId)) return;
    setLoading(true);
    requestsApi.getOne(requestId)
      .then(({ data }) => setRequest(data))
      .catch((err: any) => setError(
        err?.response?.data?.message || err?.message || 'Demande introuvable.',
      ))
      .finally(() => setLoading(false));
  }, [requestId]);

  const laborCost = parseFloat(form.laborCost) || 0;
  const tva       = laborCost * (VAT_RATE / 100);
  const totalTTC  = laborCost + tva;

  const handleSubmit = async () => {
    if (!requestId || !UUID_RE.test(requestId)) return;
    if (!form.laborCost) {
      toast.error("Veuillez renseigner le montant de la main d'œuvre.");
      return;
    }
    if (!form.validUntil) {
      toast.error('Veuillez indiquer une date de validité.');
      return;
    }
    setSubmitting(true);
    try {
      await quotesApi.create({
        requestId,
        laborCost,
        description: form.description || undefined,
        validUntil:  new Date(form.validUntil).toISOString(),
      });
      toast.success('Devis envoyé !');
      router.push('/dashboard/installer');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || "Erreur lors de l'envoi du devis.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!requestId || !UUID_RE.test(requestId)) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4">
      <div className="card max-w-sm w-full text-center py-10 space-y-3">
        <p className="text-red-600 font-medium">Identifiant de demande manquant ou invalide.</p>
        <Link href="/dashboard/installer" className="btn-outline text-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />Retour au tableau de bord
        </Link>
      </div>
    </div>
  );

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

  const ProjIcon = PROJ_ICONS[request?.projectType] ?? Building2;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        <Link href="/dashboard/installer" className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary">
          <ArrowLeft className="w-4 h-4" />Tableau de bord
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* ── Page title ── */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Nouveau devis</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              <Send className="w-3.5 h-3.5" />Brouillon
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Remplissez les informations ci-dessous et envoyez votre devis au client.
          </p>
        </div>

        {/* ── Client info ── */}
        {request?.user && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-gray-900">Client</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {request.user.firstName?.[0]}{request.user.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {request.user.firstName} {request.user.lastName}
                </p>
                <p className="text-sm text-gray-500">{request.user.email}</p>
                {request.user.phone && (
                  <p className="text-sm text-gray-500">{request.user.phone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Project / Request info ── */}
        {request && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-gray-900">Demande associée</h2>
            </div>
            <dl className="divide-y divide-gray-100">
              {[
                {
                  label: 'Type de projet',
                  value: (
                    <span className="flex items-center gap-1.5 justify-end">
                      <ProjIcon className="w-3.5 h-3.5 text-gray-400" />
                      {PROJ_LABELS[request.projectType] ?? request.projectType}
                    </span>
                  ),
                },
                {
                  label: 'Puissance demandée',
                  value: (
                    <span className="flex items-center gap-1.5 justify-end">
                      <ZapIcon className="w-3.5 h-3.5 text-yellow-500" />
                      {request.powerLevel} — {POWER_LABELS[request.powerLevel] ?? ''}
                    </span>
                  ),
                },
                {
                  label: 'Adresse',
                  value: `${request.address ?? ''}${request.address && request.city ? ', ' : ''}${request.city ?? ''}`,
                },
                ...(request.description ? [{ label: 'Description', value: request.description }] : []),
                ...(request.createdAt   ? [{
                  label: 'Reçue le',
                  value: new Date(request.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  }),
                }] : []),
              ].map((row, i) => (
                <div key={i} className="py-3 flex justify-between gap-4">
                  <dt className="text-sm text-gray-500 shrink-0 w-40">{row.label}</dt>
                  <dd className="text-sm font-semibold text-gray-800 text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* ── Quote form ── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Euro className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-gray-900">Détail du devis</h2>
          </div>

          {/* Labor cost */}
          <div>
            <label className="label">
              Main d'œuvre HT (€) <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex : 1 500,00"
              value={form.laborCost}
              onChange={e => setForm({ ...form, laborCost: e.target.value })}
            />
          </div>

          {/* Live price breakdown */}
          {form.laborCost && (
            <dl className="bg-gray-50 rounded-xl px-4 divide-y divide-gray-200">
              {[
                { label: "Main d'œuvre HT",  value: `${laborCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` },
                { label: `TVA (${VAT_RATE}%)`, value: `${tva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` },
              ].map(row => (
                <div key={row.label} className="py-2.5 flex justify-between">
                  <dt className="text-sm text-gray-500">{row.label}</dt>
                  <dd className="text-sm font-semibold text-gray-700">{row.value}</dd>
                </div>
              ))}
              <div className="py-3 flex justify-between">
                <dt className="text-base font-bold text-gray-900">Total TTC</dt>
                <dd className="text-base font-bold text-primary">
                  {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </dd>
              </div>
            </dl>
          )}

          {/* Notes */}
          <div>
            <label className="label flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Notes / Détail des prestations
            </label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Ex : Fourniture et pose d'une borne 7,4 kW, câblage tableau électrique, mise en service…"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Validity date */}
          <div>
            <label className="label flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Valable jusqu'au <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.validUntil}
              onChange={e => setForm({ ...form, validUntil: e.target.value })}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.laborCost || !form.validUntil}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Envoi en cours…' : 'Envoyer le devis'}
          </button>
        </div>

      </div>
    </div>
  );
}