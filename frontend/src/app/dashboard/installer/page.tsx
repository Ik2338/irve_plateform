'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallerNav from '@/components/InstallerNav';
import {
  MapPin, Send, Star, FileText, AlertCircle, X,
  Zap, Calendar, Home, ChevronRight, UserCheck, Inbox,
  Wrench, BadgeCheck, Clock, CheckCircle2, AlertTriangle,
  Building2, Hotel, Users, Euro, Mail, Phone, Plug,
  ParkingSquare, Hash,
} from 'lucide-react';
import Link from 'next/link';
import { matchingApi, quotesApi, installersApi, requestsApi } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Labels ───────────────────────────────────────────────────────────────────
const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise',
  COPROPRIETE: 'Copropriété', HOTEL: 'Hôtel', SYNDIC: 'Syndic',
};
const PROJ_ICONS: Record<string, any> = {
  RESIDENTIAL: Home, COMMERCIAL: Building2, COPROPRIETE: Users,
  HOTEL: Hotel, SYNDIC: Users,
};
const POWER_LABELS: Record<string, string> = {
  P1: '3,7 kW — Charge lente',
  P2: '7,4 kW — Charge standard',
  P3: '11 kW — Charge accélérée',
  P4: '22 kW — Charge rapide AC',
  P5: '> 22 kW — Charge très rapide',
};
const CONNECTOR_LABELS: Record<string, string> = {
  TYPE2_AC: 'Type 2 AC (standard EU)',
  CCS:      'CCS Combo 2 (DC)',
  CHADEMO:  'CHAdeMO',
};
const PARKING_TYPE_LABELS: Record<string, string> = {
  INDOOR: 'Couvert / sous-sol', OUTDOOR: 'Extérieur', SEMI_COVERED: 'Semi-couvert',
};
const PARKING_ACCESS_LABELS: Record<string, string> = {
  PRIVATE: 'Accès privé', PUBLIC: 'Accès public', MIXED: 'Accès mixte',
};
const VAT_RATE = 20;

// ─── Modal : Démarrer ou Terminer une installation ────────────────────────────
function MarkDoneModal({
  quote, onConfirm, onCancel, loading,
}: {
  quote: any; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const isStarting = quote?.request?.status === 'QUOTE_ACCEPTED';
  const Icon = isStarting ? Wrench : BadgeCheck;
  const iconBg    = isStarting ? 'bg-blue-100'  : 'bg-green-100';
  const iconColor = isStarting ? 'text-blue-600' : 'text-green-600';
  const btnClass  = isStarting
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-green-500 hover:bg-green-600 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center`}>
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold">
            {isStarting ? "Démarrer l'installation ?" : 'Marquer comme terminée ?'}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isStarting
              ? "Confirmez que vous commencez l'installation chez le client. Le statut passera en \"En cours\"."
              : 'Le client devra confirmer la réception avant que votre commission soit débloquée.'}
          </p>
          {!isStarting && (
            <div className="w-full flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                La commission n&apos;est débloquée qu&apos;après confirmation du client.
                Ne marquez terminé que si l&apos;installation est réellement effectuée.
              </p>
            </div>
          )}
          <p className="text-sm font-medium text-gray-700">
            {quote?.request?.projectType} — {quote?.request?.city}
          </p>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="flex-1 btn-outline text-sm py-2.5" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button
            className={`flex-1 text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 ${btnClass}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'En cours…' : isStarting ? 'Démarrer' : 'Marquer terminée'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal : Détail lead zone + formulaire devis ──────────────────────────────
function ZoneLeadModal({
  lead,
  alreadyQuoted,
  onClose,
  onQuoteSent,
}: {
  lead: any;
  alreadyQuoted: boolean;
  onClose: () => void;
  onQuoteSent: () => void;
}) {
  const [form, setForm] = useState({ laborCost: '', notes: '', validUntil: '' });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const laborCost = parseFloat(form.laborCost) || 0;
  const tva       = laborCost * (VAT_RATE / 100);
  const totalTTC  = laborCost + tva;

  const ProjIcon = PROJ_ICONS[lead?.projectType] ?? Building2;

  const handleSend = async () => {
    if (!form.laborCost) { toast.error("Veuillez renseigner le montant de la main d'œuvre."); return; }
    if (!form.validUntil) { toast.error('Veuillez indiquer une date de validité.'); return; }
    setSubmitting(true);
    try {
      await quotesApi.create({
        requestId:  lead.id,
        laborCost,
        notes:      form.notes || undefined,
        validUntil: new Date(form.validUntil).toISOString(),
      });
      toast.success('Devis envoyé !');
      onQuoteSent();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || "Erreur lors de l'envoi du devis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Détail de la demande</h2>
              <p className="text-xs text-gray-400">
                Reçue le {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 max-h-[82vh] overflow-y-auto">

          {/* ── Projet ── */}
          <section>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Projet</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                <ProjIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{PROJ_LABELS[lead.projectType] ?? lead.projectType}</p>
                <p className="text-xs text-gray-400">{POWER_LABELS[lead.powerLevel] ?? lead.powerLevel}</p>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {[
                { label: 'Puissance',        value: `${lead.powerLevel} — ${POWER_LABELS[lead.powerLevel] ?? ''}` },
                { label: 'Adresse',          value: `${lead.address ? lead.address + ', ' : ''}${lead.city} ${lead.postalCode ?? ''}` },
                { label: 'Distance',         value: `${parseFloat(lead.distance_km || 0).toFixed(1)} km de vous` },
                ...(lead.quantity ? [{ label: 'Nb de bornes', value: `${lead.quantity} borne${lead.quantity > 1 ? 's' : ''}` }] : []),
                ...(lead.urgency  ? [{ label: 'Urgence',      value: lead.urgency }] : []),
              ].map(row => (
                <div key={row.label} className="py-2.5 flex justify-between gap-4">
                  <dt className="text-sm text-gray-400 shrink-0 w-36">{row.label}</dt>
                  <dd className="text-sm font-semibold text-gray-800 text-right">{row.value}</dd>
                </div>
              ))}
            </div>

            {/* Google Maps link */}
            {lead.city && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${lead.address ?? ''} ${lead.city} ${lead.postalCode ?? ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
              >
                <MapPin className="w-3 h-3" />Voir sur Google Maps
              </a>
            )}
          </section>

          {/* ── Connecteurs ── */}
          {lead.connectors?.length > 0 && (
            <section>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Connecteurs</p>
              <div className="space-y-1.5">
                {lead.connectors.map((c: string) => (
                  <div key={c} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <Plug className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-sm text-gray-700">{CONNECTOR_LABELS[c] ?? c}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Parking ── */}
          {(lead.parkingType || lead.parkingAccess || lead.parkingSpots) && (
            <section>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Parking</p>
              <div className="divide-y divide-gray-50">
                {[
                  lead.parkingType   && { label: "Type d'espace",     value: PARKING_TYPE_LABELS[lead.parkingType]   ?? lead.parkingType   },
                  lead.parkingAccess && { label: "Type d'accès",      value: PARKING_ACCESS_LABELS[lead.parkingAccess] ?? lead.parkingAccess },
                  lead.parkingSpots  && { label: "Nb d'emplacements", value: `${lead.parkingSpots} place${lead.parkingSpots > 1 ? 's' : ''}` },
                ].filter(Boolean).map((row: any) => (
                  <div key={row.label} className="py-2.5 flex justify-between gap-4">
                    <dt className="text-sm text-gray-400 shrink-0 w-36">{row.label}</dt>
                    <dd className="text-sm font-semibold text-gray-800 text-right">{row.value}</dd>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Notes client ── */}
          {(lead.notes || lead.description) && (
            <section>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Remarques</p>
              <blockquote className="border-l-4 border-primary pl-3 text-sm text-gray-700 italic leading-relaxed">
                &ldquo;{lead.notes ?? lead.description}&rdquo;
              </blockquote>
            </section>
          )}

          {/* ── Client (anonymisé si zone) ── */}
          {lead.user && (
            <section className="bg-gradient-to-br from-white to-primary-light/20 border border-primary/10 rounded-xl px-4 py-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Client</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  {lead.user.firstName?.[0]}{lead.user.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{lead.user.firstName} {lead.user.lastName}</p>
                  {lead.user.role && (
                    <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{lead.user.role === 'CLIENT' ? 'Client' : lead.user.role}</span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {lead.user.email && (
                  <div className="py-2 flex justify-between gap-4">
                    <dt className="text-sm text-gray-400">Email</dt>
                    <dd>
                      <a href={`mailto:${lead.user.email}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />{lead.user.email}
                      </a>
                    </dd>
                  </div>
                )}
                {lead.user.phone && (
                  <div className="py-2 flex justify-between gap-4">
                    <dt className="text-sm text-gray-400">Téléphone</dt>
                    <dd>
                      <a href={`tel:${lead.user.phone}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />{lead.user.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </div>
              {(lead.user.email || lead.user.phone) && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-primary/10">
                  {lead.user.email && (
                    <a href={`mailto:${lead.user.email}`} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg transition-colors">
                      <Mail className="w-3.5 h-3.5" />Email
                    </a>
                  )}
                  {lead.user.phone && (
                    <a href={`tel:${lead.user.phone}`} className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-white hover:bg-primary-light px-3 py-2 rounded-lg transition-colors">
                      <Phone className="w-3.5 h-3.5" />Appeler
                    </a>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Devis ── */}
          {alreadyQuoted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Send className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">Devis déjà envoyé</p>
                <p className="text-xs text-green-600">Vous avez déjà soumis un devis pour cette demande.</p>
              </div>
            </div>
          ) : !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              Rédiger un devis
            </button>
          ) : (
            <section>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Votre devis</p>

              {/* Recap pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                  <Zap className="w-3 h-3" />{POWER_LABELS[lead?.powerLevel] ?? lead?.powerLevel}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                  <MapPin className="w-3 h-3" />{lead?.city}
                </span>
              </div>

              <div className="space-y-3">
                {/* Labor cost */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Main d&apos;œuvre HT (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex : 1 500,00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.laborCost}
                    onChange={e => setForm({ ...form, laborCost: e.target.value })}
                  />
                </div>

                {/* Live breakdown */}
                {form.laborCost && (
                  <dl className="bg-gray-50 rounded-xl px-4 divide-y divide-gray-200">
                    {[
                      { label: "Main d'œuvre HT", value: `${laborCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` },
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes / Prestations</label>
                  <textarea
                    rows={3}
                    placeholder="Ex : Fourniture et pose d'une borne 7,4 kW, câblage, mise en service…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                {/* Validity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Valable jusqu&apos;au <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.validUntil}
                    onChange={e => setForm({ ...form, validUntil: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSend}
                    disabled={submitting || !form.laborCost || !form.validUntil}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Envoi…' : 'Envoyer le devis'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 btn-outline text-sm rounded-xl"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
const IN_PROGRESS_STATUSES = ['QUOTE_ACCEPTED', 'INSTALLATION', 'MISE_EN_SERVICE'];

export default function InstallerDashboard() {
  const router = useRouter();
  const [profile, setProfile]   = useState<any>(null);
  const [leads, setLeads]       = useState<any[]>([]);
  const [quotes, setQuotes]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const [markDoneTarget, setMarkDoneTarget] = useState<any>(null);
  const [markingDone, setMarkingDone]       = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('irve_user');
    if (!u) { router.push('/auth/login'); return; }
    Promise.all([matchingApi.leads(), quotesApi.forInstaller(), installersApi.myProfile()])
      .then(([l, q, p]) => {
        setLeads(l.data);
        setQuotes(q.data);
        setProfile(p.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshQuotes = async () => {
    const q = await quotesApi.forInstaller();
    setQuotes(q.data);
  };

  const alreadyQuoted = (leadId: string) =>
    quotes.some(q => q.requestId === leadId || q.request?.id === leadId);

  const handleLeadClick = (lead: any) => {
    if (lead.source === 'DIRECT') {
      router.push(`/dashboard/installer/requests/${lead.id}`);
    } else {
      setSelectedLead(lead);
    }
  };

  const handleMarkDone = async () => {
    if (!markDoneTarget) return;
    const nextStatus =
      markDoneTarget.request?.status === 'QUOTE_ACCEPTED' ? 'INSTALLATION' : 'MISE_EN_SERVICE';
    setMarkingDone(true);
    try {
      await requestsApi.updateStatus(markDoneTarget.request.id, nextStatus);
      toast.success(nextStatus === 'INSTALLATION' ? 'Installation démarrée !' : 'En attente de confirmation du client…');
      await refreshQuotes();
      setMarkDoneTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setMarkingDone(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const directLeads        = leads.filter(l => l.source === 'DIRECT');
  const zoneLeads          = leads.filter(l => l.source !== 'DIRECT');
  const activeInstallations = quotes.filter(q =>
    q.status === 'ACCEPTED' && IN_PROGRESS_STATUSES.includes(q.request?.status),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <InstallerNav />

      {markDoneTarget && (
        <MarkDoneModal
          quote={markDoneTarget}
          onConfirm={handleMarkDone}
          onCancel={() => setMarkDoneTarget(null)}
          loading={markingDone}
        />
      )}

      {selectedLead && (
        <ZoneLeadModal
          lead={selectedLead}
          alreadyQuoted={alreadyQuoted(selectedLead.id)}
          onClose={() => setSelectedLead(null)}
          onQuoteSent={async () => {
            setSelectedLead(null);
            await refreshQuotes();
          }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {!profile && (
          <div className="card border-orange-200 bg-orange-50 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              Complétez votre{' '}
              <Link href="/dashboard/installer/profile" className="font-semibold underline">
                profil installateur
              </Link>{' '}
              pour apparaître dans les recherches.
            </p>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Leads disponibles',      value: zoneLeads.length,                                   Icon: MapPin },
            { label: 'Installations en cours', value: activeInstallations.length,                         Icon: Wrench },
            { label: 'Devis acceptés',         value: quotes.filter(q => q.status === 'ACCEPTED').length, Icon: Star   },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ Installations en cours ══ */}
        {activeInstallations.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold">Installations en cours</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                {activeInstallations.length} chantier{activeInstallations.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3 mb-8">
              {activeInstallations.map(q => {
                const reqStatus = q.request?.status;
                const total     = q.laborCost ?? 0;
                return (
                  <div
                    key={q.id}
                    className={`card border-l-4 ${
                      reqStatus === 'MISE_EN_SERVICE' ? 'border-violet-400 bg-violet-50/40' :
                      reqStatus === 'INSTALLATION'    ? 'border-blue-400' :
                      'border-green-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900">
                            {q.request?.projectType} — {q.request?.powerLevel}
                          </span>
                          <span className="text-gray-400 text-xs">·</span>
                          <span className="text-sm text-gray-500">{q.request?.city}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {[
                            { key: 'INSTALLATION',    label: 'Démarré',  active: ['INSTALLATION','MISE_EN_SERVICE'].includes(reqStatus), color: 'bg-blue-500' },
                            { key: 'MISE_EN_SERVICE', label: 'Terminé',  active: reqStatus === 'MISE_EN_SERVICE', color: 'bg-violet-500' },
                            { key: 'DONE',            label: 'Confirmé', active: false, color: 'bg-green-500' },
                          ].map((step, i, arr) => (
                            <div key={step.key} className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${step.active ? step.color : 'bg-gray-200'}`} />
                              <span className="text-xs text-gray-500">{step.label}</span>
                              {i < arr.length - 1 && <div className={`h-0.5 w-6 ml-1 ${step.active ? 'bg-blue-200' : 'bg-gray-200'}`} />}
                            </div>
                          ))}
                        </div>
                        <div className="text-primary font-bold mt-2">
                          {total.toLocaleString('fr-FR')} € HT
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {reqStatus === 'QUOTE_ACCEPTED' && (
                          <button onClick={() => setMarkDoneTarget(q)} className="btn-primary text-sm flex items-center gap-2 px-4 py-2">
                            <Wrench className="w-4 h-4" />Démarrer
                          </button>
                        )}
                        {reqStatus === 'INSTALLATION' && (
                          <button onClick={() => setMarkDoneTarget(q)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-colors">
                            <CheckCircle2 className="w-4 h-4" />Terminer
                          </button>
                        )}
                        {reqStatus === 'MISE_EN_SERVICE' && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-violet-100 rounded-lg">
                            <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
                            <span className="text-sm text-violet-700 font-medium">Attente client…</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ Demandes personnelles (DIRECT) ══ */}
        {directLeads.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-lg font-semibold">Demandes personnelles</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                {directLeads.length} nouvelle{directLeads.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3 -mt-2">
              Un client vous a contacté directement. Acceptez ou refusez avant d&apos;envoyer un devis.
            </p>
            <div className="space-y-3 mb-8">
              {directLeads.map(lead => (
                <div
                  key={lead.id}
                  className="card cursor-pointer hover:shadow-md transition-shadow border-l-4 border-violet-400"
                  onClick={() => handleLeadClick(lead)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-5 h-5 text-violet-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="badge-blue">{lead.projectType}</span>
                          <span className="badge-orange">{lead.powerLevel}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                            À accepter / refuser
                          </span>
                          {alreadyQuoted(lead.id) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Devis envoyé
                            </span>
                          )}
                        </div>
                        {(lead.clientName || lead.user?.name) && (
                          <p className="text-sm font-medium text-gray-700">
                            {lead.clientName || lead.user?.name}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />{lead.city} ({lead.postalCode})
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ Demandes dans ma zone ══ */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <Inbox className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Demandes dans ma zone</h2>
        </div>
        <p className="text-sm text-gray-500 mb-3 -mt-2">
          Demandes ouvertes à tous les installateurs de la région. Envoyez un devis directement.
        </p>
        {zoneLeads.length === 0 ? (
          <div className="card text-center py-8 text-gray-500 mb-8">
            Aucune demande dans votre zone pour le moment.
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {zoneLeads.map(lead => (
              <div
                key={lead.id}
                className="card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleLeadClick(lead)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-blue">{lead.projectType}</span>
                        <span className="badge-orange">{lead.powerLevel}</span>
                        {alreadyQuoted(lead.id) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Devis envoyé
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {lead.city} ({lead.postalCode})
                        <span className="text-gray-400 ml-1">· à {parseFloat(lead.distance_km || 0).toFixed(1)} km</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ Mes devis envoyés ══ */}
        <h2 className="text-lg font-semibold mb-4">Mes devis envoyés</h2>
        {quotes.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">Aucun devis envoyé.</div>
        ) : (
          <div className="space-y-3">
            {quotes
              .filter(q => !IN_PROGRESS_STATUSES.includes(q.request?.status) || q.status !== 'ACCEPTED')
              .map(q => {
                const total = q.laborCost ?? 0;
                return (
                  <Link
                    key={q.id}
                    href={`/dashboard/installer/quotes/${q.id}`}
                    className="card flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="font-medium">{q.request?.projectType} – {q.request?.powerLevel}</div>
                      <div className="text-sm text-gray-500">{q.request?.city}</div>
                      <div className="text-primary font-bold">{total.toLocaleString('fr-FR')} € HT</div>
                    </div>
                    <span className={
                      q.status === 'ACCEPTED' ? 'badge-green' :
                      q.status === 'REFUSED'  ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' :
                      'badge-orange'
                    }>
                      {q.status}
                    </span>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}