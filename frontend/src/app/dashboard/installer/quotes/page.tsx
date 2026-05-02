'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallerNav from '@/components/InstallerNav';
import { quotesApi } from '@/lib/api';
import {
  Send, CheckCircle, XCircle, Clock, ChevronRight, X,
  User, Mail, Phone, MapPin, Zap, Calendar, Euro, FileText,
  Hash, AlertCircle, Home, Building2, Layers
} from 'lucide-react';

// ─── Config statut ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; class: string; Icon: any; color: string; bg: string }> = {
  SENT:     { label: 'En attente',  class: 'badge-orange', Icon: Clock,        color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  ACCEPTED: { label: 'Accepté',    class: 'badge-green',  Icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200'   },
  REFUSED:  { label: 'Refusé',     class: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700',   Icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50 border-red-200'       },
  EXPIRED:  { label: 'Expiré',     class: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500', Icon: AlertCircle, color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200'     },
};

const PROJ_LABELS: Record<string, string>   = { RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise', COPROPRIETE: 'Copropriété' };
const PROJ_ICONS:  Record<string, any>      = { RESIDENTIAL: Home, COMMERCIAL: Building2, COPROPRIETE: Layers };
const POWER_LABELS: Record<string, string>  = { P1: '3,7 kW', P2: '7,4 kW', P3: '11 kW', P4: '22 kW', P5: '> 22 kW' };

// ─── Modale détail devis ──────────────────────────────────────────────────────
function QuoteModal({ quote, onClose }: { quote: any; onClose: () => void }) {
  const status = STATUS_CONFIG[quote.status] || STATUS_CONFIG['SENT'];
  const StatusIcon = status.Icon;
  const ProjIcon   = PROJ_ICONS[quote.request?.projectType] || FileText;
  const client     = quote.request?.user;
  const request    = quote.request;

  const vatAmount  = (quote.amount * (quote.vatRate || 20)) / 100;
  const totalTTC   = quote.amount + vatAmount;

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center
              ${quote.status === 'ACCEPTED' ? 'bg-green-100' : quote.status === 'REFUSED' ? 'bg-red-100' : 'bg-orange-100'}`}>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Détail du devis</h2>
              <p className="text-xs text-gray-400">
                Envoyé le {new Date(quote.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Statut */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${status.bg}`}>
            <StatusIcon className={`w-5 h-5 flex-shrink-0 ${status.color}`} />
            <div>
              <p className={`font-semibold text-sm ${status.color}`}>{status.label}</p>
              {quote.status === 'SENT' && (
                <p className="text-xs text-gray-500">
                  Valide jusqu'au {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>

          {/* Infos client */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />Informations client
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {client?.firstName?.[0]}{client?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{client?.firstName} {client?.lastName}</p>
                <p className="text-xs text-gray-400">
                  Client depuis {client?.createdAt
                    ? new Date(client.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-gray-200">
              {client?.email && (
                <a href={`mailto:${client.email}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors bg-white rounded-xl px-3 py-2 border border-gray-100">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </a>
              )}
              {client?.phone ? (
                <a href={`tel:${client.phone}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors bg-white rounded-xl px-3 py-2 border border-gray-100">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {client.phone}
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-white rounded-xl px-3 py-2 border border-gray-100">
                  <Phone className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  Téléphone non renseigné
                </div>
              )}
            </div>
          </div>

          {/* Détails de la demande */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />Demande d'installation
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { Icon: ProjIcon,  label: 'Type de projet',   value: PROJ_LABELS[request?.projectType] || request?.projectType },
                { Icon: Zap,       label: 'Puissance',        value: `${request?.powerLevel} — ${POWER_LABELS[request?.powerLevel] || ''}` },
                { Icon: MapPin,    label: 'Adresse',          value: `${request?.address || ''}, ${request?.city || ''}` },
                { Icon: Calendar,  label: 'Demande créée le', value: request?.createdAt ? new Date(request.createdAt).toLocaleDateString('fr-FR') : '—' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Icon className="w-3 h-3" />{label}
                  </div>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>
            {request?.description && (
              <div className="mt-2 bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700">{request.description}</p>
              </div>
            )}
            {request?.hasExistingPanel && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />Tableau électrique existant à proximité
              </div>
            )}
          </div>

          {/* Détail financier */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5" />Détail financier
            </p>
            <div className="space-y-2">
              {[
                { label: "Main d'œuvre", value: quote.laborCost },
                { label: 'Matériel',     value: quote.materialCost },
              ].filter(r => r.value != null).map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm py-2 border-b border-gray-200">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{value?.toLocaleString('fr-FR')} € HT</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-500">Total HT</span>
                <span className="font-medium">{quote.amount?.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-500">TVA ({quote.vatRate || 20}%)</span>
                <span className="font-medium">{vatAmount.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between py-3 bg-primary/5 rounded-xl px-3 mt-1">
                <span className="font-bold text-gray-800">Total TTC</span>
                <span className="font-bold text-primary text-lg">{totalTTC.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
            {quote.notes && (
              <div className="mt-3 bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Notes / Conditions</p>
                <p className="text-sm text-gray-700 italic">"{quote.notes}"</p>
              </div>
            )}
          </div>

          {/* CTA si accepté */}
          {quote.status === 'ACCEPTED' && client?.phone && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-3">
                ✅ Devis accepté — Contactez le client pour planifier l'intervention
              </p>
              <div className="flex gap-3 flex-wrap">
                <a href={`tel:${client.phone}`}
                  className="btn-primary text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />Appeler {client.firstName}
                </a>
                <a href={`mailto:${client.email}`}
                  className="btn-outline text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />Envoyer un email
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <button onClick={onClose}
            className="w-full btn-outline text-sm font-medium">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function InstallerQuotesPage() {
  const router = useRouter();
  const [quotes,       setQuotes]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('irve_user');
    if (!u) { router.push('/auth/login'); return; }
    quotesApi.forInstaller()
      .then(({ data }) => setQuotes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:       quotes.length,
    accepted:    quotes.filter(q => q.status === 'ACCEPTED').length,
    pending:     quotes.filter(q => q.status === 'SENT').length,
    totalAmount: quotes.filter(q => q.status === 'ACCEPTED').reduce((s, q) => s + (q.amount || 0), 0),
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <InstallerNav />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mes devis</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total envoyés', value: stats.total },
            { label: 'En attente',    value: stats.pending },
            { label: 'Acceptés',      value: stats.accepted },
            { label: 'CA accepté',    value: `${stats.totalAmount.toLocaleString('fr-FR')} €` },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Liste — chaque devis ouvre le popup */}
        {quotes.length === 0 ? (
          <div className="card text-center py-16 text-gray-500">
            <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium mb-1">Aucun devis envoyé</p>
            <p className="text-sm">Consultez les leads disponibles pour envoyer votre premier devis.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map(q => {
              const status = STATUS_CONFIG[q.status] || STATUS_CONFIG['SENT'];
              const StatusIcon = status.Icon;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuote(q)}
                  className="card w-full text-left flex items-center justify-between gap-4 hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icône statut */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${q.status === 'ACCEPTED' ? 'bg-green-100' : q.status === 'REFUSED' ? 'bg-red-100' : 'bg-orange-100'}`}>
                      <StatusIcon className={`w-5 h-5
                        ${q.status === 'ACCEPTED' ? 'text-green-600' : q.status === 'REFUSED' ? 'text-red-500' : 'text-orange-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {PROJ_LABELS[q.request?.projectType] || q.request?.projectType} — {q.request?.powerLevel}
                        </span>
                        <span className={status.class}>{status.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{q.request?.city}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Envoyé le {new Date(q.createdAt).toLocaleDateString('fr-FR')} ·{' '}
                        valide jusqu'au {new Date(q.validUntil).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-primary">{q.amount?.toLocaleString('fr-FR')} €</div>
                      <div className="text-xs text-gray-400">HT</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale */}
      {selectedQuote && (
        <QuoteModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}
    </div>
  );
}