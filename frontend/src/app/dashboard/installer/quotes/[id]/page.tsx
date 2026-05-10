'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InstallerNav from '@/components/InstallerNav';
import Link from 'next/link';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Zap, Calendar,
  CheckCircle, Clock, XCircle, Euro, FileText, Hash, AlertCircle
} from 'lucide-react';
import { quotesApi } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  SENT:     { label: 'En attente de réponse', Icon: Clock,        color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  ACCEPTED: { label: 'Devis accepté !',        Icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  REFUSED:  { label: 'Devis refusé',           Icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
  EXPIRED:  { label: 'Devis expiré',           Icon: AlertCircle, color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
};

const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise', COPROPRIETE: 'Copropriété'
};

const POWER_LABELS: Record<string, string> = {
  P1: '3,7 kW', P2: '7,4 kW', P3: '11 kW', P4: '22 kW', P5: '> 22 kW'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params?.id as string;
    if (!id || !UUID_REGEX.test(id)) return;

    const token = localStorage.getItem('irve_token');
    if (!token) { router.push('/auth/login'); return; }

    // ✅ Passe par nginx /api/ — plus de localhost:3001 hardcodé
    quotesApi.getOne(id)
      .then(({ data }) => setQuote(data))
      .catch((e: any) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (error || !quote) return (
    <div className="min-h-screen bg-gray-50">
      <InstallerNav />
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 mb-4">{error || 'Devis introuvable'}</p>
        <Link href="/dashboard/installer/quotes" className="btn-outline flex items-center gap-2 w-fit mx-auto">
          <ArrowLeft className="w-4 h-4" />Retour aux devis
        </Link>
      </div>
    </div>
  );

  const status = STATUS_CONFIG[quote.status] || STATUS_CONFIG['SENT'];
  const StatusIcon = status.Icon;
  const vatAmount = (quote.amount * quote.vatRate) / 100;
  const totalTTC = quote.amount + vatAmount;
  const client = quote.request?.user;
  const request = quote.request;

  return (
    <div className="min-h-screen bg-gray-50">
      <InstallerNav />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/installer/quotes"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />Retour aux devis
          </Link>
          <span className="text-xs text-gray-400">
            Devis du {new Date(quote.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Statut */}
        <div className={`card border flex items-center gap-3 ${status.bg}`}>
          <StatusIcon className={`w-5 h-5 flex-shrink-0 ${status.color}`} />
          <div>
            <p className={`font-semibold ${status.color}`}>{status.label}</p>
            {quote.status === 'SENT' && (
              <p className="text-xs text-gray-500 mt-0.5">
                Valide jusqu'au {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>

        {/* Infos client */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 font-semibold text-gray-700 text-sm">
            <User className="w-4 h-4 text-primary" />Informations client
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {client?.firstName?.[0]}{client?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{client?.firstName} {client?.lastName}</p>
                <p className="text-xs text-gray-400">
                  Client depuis {client?.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-50">
              {client?.email && (
                <a href={`mailto:${client.email}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="truncate">{client.email}</span>
                </a>
              )}
              {client?.phone ? (
                <a href={`tel:${client.phone}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  {client.phone}
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-gray-300" />
                  </div>
                  Téléphone non renseigné
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails de la demande */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 font-semibold text-gray-700 text-sm">
            <FileText className="w-4 h-4 text-primary" />Détails de la demande
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: Hash,     label: 'Type de projet',   value: PROJ_LABELS[request?.projectType] || request?.projectType },
              { Icon: Zap,      label: 'Puissance',        value: `${request?.powerLevel} — ${POWER_LABELS[request?.powerLevel] || ''}` },
              { Icon: MapPin,   label: 'Adresse',          value: `${request?.address || ''}, ${request?.city || ''}` },
              { Icon: Calendar, label: 'Demande créée le', value: new Date(request?.createdAt).toLocaleDateString('fr-FR') },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <Icon className="w-3 h-3" />{label}
                </div>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>
          {request?.description && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700">{request.description}</p>
            </div>
          )}
          {request?.hasExistingPanel && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-green-700">
              <CheckCircle className="w-3.5 h-3.5" />Tableau électrique existant à proximité
            </div>
          )}
        </div>

        {/* Montants du devis */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 font-semibold text-gray-700 text-sm">
            <Euro className="w-4 h-4 text-primary" />Détail financier du devis
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500">Main d'œuvre</span>
              <span className="font-medium">{quote.laborCost?.toLocaleString('fr-FR')} € HT</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500">Matériel</span>
              <span className="font-medium">{quote.materialCost?.toLocaleString('fr-FR')} € HT</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500">Total HT</span>
              <span className="font-medium">{quote.amount?.toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500">TVA ({quote.vatRate}%)</span>
              <span className="font-medium">{vatAmount.toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between py-3 bg-primary-light rounded-xl px-3">
              <span className="font-bold text-gray-800">Total TTC</span>
              <span className="font-bold text-primary text-lg">{totalTTC.toLocaleString('fr-FR')} €</span>
            </div>
          </div>
          {quote.notes && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Notes / Conditions</p>
              <p className="text-sm text-gray-700 italic">"{quote.notes}"</p>
            </div>
          )}
        </div>

        {/* Actions rapides */}
        {quote.status === 'ACCEPTED' && client?.phone && (
          <div className="card border-green-200 bg-green-50">
            <p className="text-sm font-semibold text-green-800 mb-3">✅ Devis accepté — Contactez le client pour planifier l'intervention</p>
            <div className="flex gap-3">
              <a href={`tel:${client.phone}`} className="btn-primary text-sm flex items-center gap-2">
                <Phone className="w-4 h-4" />Appeler {client.firstName}
              </a>
              <a href={`mailto:${client.email}`} className="btn-outline text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />Envoyer un email
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}