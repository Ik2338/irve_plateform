'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, Send } from 'lucide-react';
import { requestsApi, quotesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function NewQuotePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const requestId = searchParams.get('requestId') ?? undefined;

  const [request,    setRequest]    = useState<any>(null);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const [form, setForm] = useState({
    laborCost:    '',
    materialCost: '',
    description:  '',
    validUntil:   '',
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

  const laborCost    = parseFloat(form.laborCost)    || 0;
  const materialCost = parseFloat(form.materialCost) || 0;
  const totalHT      = laborCost + materialCost;

  const handleSubmit = async () => {
    if (!requestId || !UUID_RE.test(requestId)) return;
    if (!form.laborCost && !form.materialCost) {
      toast.error('Veuillez renseigner au moins un montant.');
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
        materialCost,
        description: form.description || undefined,
        validUntil:  new Date(form.validUntil).toISOString(),
      });
      toast.success('Devis envoyé !');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || "Erreur lors de l'envoi du devis.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!requestId || !UUID_RE.test(requestId)) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4">
      <div className="card max-w-sm w-full text-center py-10 space-y-3">
        <p className="text-red-600 font-medium">Identifiant de demande manquant ou invalide.</p>
        <Link href="/dashboard" className="btn-outline text-sm inline-flex items-center gap-1">
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
        <Link href="/dashboard" className="btn-outline text-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />Retour au tableau de bord
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary">
          <ArrowLeft className="w-4 h-4" />Tableau de bord
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        <h1 className="text-xl font-bold text-gray-900">Envoyer un devis</h1>

        {request && (
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-1">Demande concernée</p>
            <p className="text-sm text-blue-700">
              {request.user?.firstName} {request.user?.lastName} — {request.address}, {request.city}
            </p>
          </div>
        )}

        <div className="card space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Main d'œuvre HT (€) <span className="text-red-500">*</span></label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex : 500"
                value={form.laborCost}
                onChange={e => setForm({ ...form, laborCost: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Matériel HT (€) <span className="text-red-500">*</span></label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex : 1000"
                value={form.materialCost}
                onChange={e => setForm({ ...form, materialCost: e.target.value })}
              />
            </div>
          </div>

          {(form.laborCost || form.materialCost) && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">Total HT</span>
              <span className="text-lg font-bold text-gray-900">
                {totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          )}

          <div>
            <label className="label">Description / Détail des prestations</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Ex : Fourniture et pose d'une borne 7,4 kW, câblage tableau électrique, mise en service…"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Valable jusqu'au <span className="text-red-500">*</span></label>
            <input
              className="input"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.validUntil}
              onChange={e => setForm({ ...form, validUntil: e.target.value })}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || (!form.laborCost && !form.materialCost) || !form.validUntil}
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