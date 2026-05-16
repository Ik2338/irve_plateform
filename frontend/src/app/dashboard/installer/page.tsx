'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallerNav from '@/components/InstallerNav';
import {
  MapPin, Send, Star, FileText, AlertCircle, X,
  Zap, Calendar, Home, ChevronRight, UserCheck, Inbox,
  Wrench, BadgeCheck, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { matchingApi, quotesApi, installersApi, requestsApi } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Modal : Démarrer ou Terminer une installation ────────────────────────────
function MarkDoneModal({
  quote,
  onConfirm,
  onCancel,
  loading,
}: {
  quote: any;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isStarting = quote?.request?.status === 'QUOTE_ACCEPTED';
  const Icon = isStarting ? Wrench : BadgeCheck;
  const iconBg = isStarting ? 'bg-blue-100' : 'bg-green-100';
  const iconColor = isStarting ? 'text-blue-600' : 'text-green-600';
  const btnClass = isStarting
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
            {isStarting ? 'Démarrer l\'installation ?' : 'Marquer comme terminée ?'}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isStarting
              ? 'Confirmez que vous commencez l\'installation chez le client. Le statut passera en "En cours".'
              : 'Le client devra confirmer la réception avant que votre commission soit débloquée.'}
          </p>
          {/* Avertissement anti-fraude uniquement sur l'étape finale */}
          {!isStarting && (
            <div className="w-full flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                La commission n'est débloquée qu'après confirmation du client.
                Ne marquez terminé que si l'installation est réellement effectuée.
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

// ─── Page principale ──────────────────────────────────────────────────────────
export default function InstallerDashboard() {
  const router = useRouter();
  const [profile, setProfile]     = useState<any>(null);
  const [leads, setLeads]         = useState<any[]>([]);
  const [quotes, setQuotes]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [quoteForm, setQuoteForm] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // MarkDone modal
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

  const sendQuote = async (requestId: string) => {
    try {
      await quotesApi.create({ requestId, ...quoteForm });
      toast.success('Devis envoyé !');
      setQuoteForm(null);
      setSelectedLead(null);
      const q = await quotesApi.forInstaller();
      setQuotes(q.data);
    } catch {
      toast.error("Erreur lors de l'envoi");
    }
  };

  const closeModal = () => {
    setSelectedLead(null);
    setQuoteForm(null);
  };

  const alreadyQuoted = (leadId: string) =>
    quotes.some(q => q.requestId === leadId || q.request?.id === leadId);

  // ── Routing selon le type de demande ──────────────────────────────────────
  const handleLeadClick = (lead: any) => {
    if (lead.source === 'DIRECT') {
      router.push(`/dashboard/installer/requests/${lead.id}`);
    } else {
      setSelectedLead(lead);
      setQuoteForm(null);
    }
  };

  // ── Avancer le statut d'une installation ──────────────────────────────────
  const handleMarkDone = async () => {
    if (!markDoneTarget) return;
    const currentStatus = markDoneTarget.request?.status;
    const nextStatus =
      currentStatus === 'QUOTE_ACCEPTED' ? 'INSTALLATION' : 'MISE_EN_SERVICE';

    setMarkingDone(true);
    try {
      await requestsApi.updateStatus(markDoneTarget.request.id, nextStatus);
      toast.success(
        nextStatus === 'INSTALLATION'
          ? 'Installation démarrée !'
          : 'En attente de confirmation du client…',
      );
      // Rafraîchir les devis
      const q = await quotesApi.forInstaller();
      setQuotes(q.data);
      setMarkDoneTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setMarkingDone(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const directLeads = leads.filter(l => l.source === 'DIRECT');
  const zoneLeads   = leads.filter(l => l.source !== 'DIRECT');

  // Devis dont le chantier est en cours (QUOTE_ACCEPTED, INSTALLATION, MISE_EN_SERVICE)
  const IN_PROGRESS_STATUSES = ['QUOTE_ACCEPTED', 'INSTALLATION', 'MISE_EN_SERVICE'];
  const activeInstallations  = quotes.filter(q =>
    q.status === 'ACCEPTED' && IN_PROGRESS_STATUSES.includes(q.request?.status),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <InstallerNav />

      {/* ── MarkDone modal ── */}
      {markDoneTarget && (
        <MarkDoneModal
          quote={markDoneTarget}
          onConfirm={handleMarkDone}
          onCancel={() => setMarkDoneTarget(null)}
          loading={markingDone}
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
            { label: 'Leads disponibles',     value: zoneLeads.length,                                   Icon: MapPin    },
            { label: 'Installations en cours', value: activeInstallations.length,                         Icon: Wrench    },
            { label: 'Devis acceptés',         value: quotes.filter(q => q.status === 'ACCEPTED').length, Icon: Star      },
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

        {/* ══ SECTION 1 : Installations en cours ══ */}
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
                const total     = (q.laborCost ?? 0) + (q.materialCost ?? 0);

                return (
                  <div
                    key={q.id}
                    className={`card border-l-4 ${
                      reqStatus === 'MISE_EN_SERVICE'
                        ? 'border-violet-400 bg-violet-50/40'
                        : reqStatus === 'INSTALLATION'
                          ? 'border-blue-400'
                          : 'border-green-400'
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

                        {/* Indicateur d'étape */}
                        <div className="flex items-center gap-3 mt-2">
                          {/* Étape 1 : Démarré */}
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              ['INSTALLATION', 'MISE_EN_SERVICE'].includes(reqStatus)
                                ? 'bg-blue-500' : 'bg-gray-200'
                            }`} />
                            <span className="text-xs text-gray-500">Démarré</span>
                          </div>
                          <div className={`h-0.5 w-8 ${
                            reqStatus === 'MISE_EN_SERVICE' ? 'bg-blue-300' : 'bg-gray-200'
                          }`} />
                          {/* Étape 2 : Terminé */}
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              reqStatus === 'MISE_EN_SERVICE' ? 'bg-violet-500' : 'bg-gray-200'
                            }`} />
                            <span className="text-xs text-gray-500">Terminé</span>
                          </div>
                          <div className="h-0.5 w-8 bg-gray-200" />
                          {/* Étape 3 : Confirmé */}
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-200" />
                            <span className="text-xs text-gray-500">Confirmé</span>
                          </div>
                        </div>

                        <div className="text-primary font-bold mt-2">
                          {total.toLocaleString('fr-FR')} € HT
                        </div>
                      </div>

                      {/* Actions progressives */}
                      <div className="flex-shrink-0">
                        {reqStatus === 'QUOTE_ACCEPTED' && (
                          <button
                            onClick={() => setMarkDoneTarget(q)}
                            className="btn-primary text-sm flex items-center gap-2 px-4 py-2"
                          >
                            <Wrench className="w-4 h-4" />
                            Démarrer l'installation
                          </button>
                        )}
                        {reqStatus === 'INSTALLATION' && (
                          <button
                            onClick={() => setMarkDoneTarget(q)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Marquer terminée
                          </button>
                        )}
                        {reqStatus === 'MISE_EN_SERVICE' && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-violet-100 rounded-lg">
                            <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
                            <span className="text-sm text-violet-700 font-medium">
                              Attente client…
                            </span>
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

        {/* ══ SECTION 2 : Demandes personnelles (source DIRECT) ══ */}
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
              Un client vous a contacté directement. Acceptez ou refusez avant d'envoyer un devis.
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
                          <MapPin className="w-3 h-3" />
                          {lead.city} ({lead.postalCode})
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(lead.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
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

        {/* ══ SECTION 3 : Demandes dans ma zone ══ */}
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
                        <span className="text-gray-400 ml-1">
                          · à {parseFloat(lead.distance_km || 0).toFixed(1)} km
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(lead.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ SECTION 4 : Devis envoyés ══ */}
        <h2 className="text-lg font-semibold mb-4">Mes devis envoyés</h2>
        {quotes.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">Aucun devis envoyé.</div>
        ) : (
          <div className="space-y-3">
            {quotes
              .filter(q => !IN_PROGRESS_STATUSES.includes(q.request?.status) || q.status !== 'ACCEPTED')
              .map(q => {
                const total = (q.laborCost ?? 0) + (q.materialCost ?? 0);
                return (
                  <Link
                    key={q.id}
                    href={`/dashboard/installer/quotes/${q.id}`}
                    className="card flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="font-medium">
                        {q.request?.projectType} – {q.request?.powerLevel}
                      </div>
                      <div className="text-sm text-gray-500">{q.request?.city}</div>
                      <div className="text-primary font-bold">
                        {total.toLocaleString('fr-FR')} € HT
                      </div>
                    </div>
                    <span
                      className={
                        q.status === 'ACCEPTED'
                          ? 'badge-green'
                          : q.status === 'REFUSED'
                            ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
                            : 'badge-orange'
                      }
                    >
                      {q.status}
                    </span>
                  </Link>
                );
              })}
          </div>
        )}
      </div>

      {/* ══ Modal détail lead (zone uniquement) ══ */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold">Détails de la demande</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Reçue le{' '}
                  {new Date(selectedLead.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Détails du projet
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Type de projet</div>
                        <div className="font-medium text-sm">{selectedLead.projectType}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Puissance</div>
                        <div className="font-medium text-sm">{selectedLead.powerLevel}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Adresse</div>
                      <div className="font-medium text-sm">
                        {selectedLead.address && <span>{selectedLead.address}, </span>}
                        {selectedLead.city} {selectedLead.postalCode}
                        <span className="text-gray-400 text-xs ml-1">
                          ({parseFloat(selectedLead.distance_km || 0).toFixed(1)} km de vous)
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedLead.housingType && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Home className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Type de logement</div>
                        <div className="font-medium text-sm">{selectedLead.housingType}</div>
                      </div>
                    </div>
                  )}
                  {selectedLead.desiredDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Date souhaitée</div>
                        <div className="font-medium text-sm">
                          {new Date(selectedLead.desiredDate).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedLead.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Notes / commentaires</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedLead.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Formulaire devis */}
              {!alreadyQuoted(selectedLead.id) ? (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Envoyer un devis
                  </h4>
                  {quoteForm ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Main d'œuvre (€ HT)</label>
                          <input
                            className="input"
                            type="number"
                            placeholder="0"
                            value={quoteForm.laborCost}
                            onChange={e => setQuoteForm({ ...quoteForm, laborCost: +e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Matériel (€ HT)</label>
                          <input
                            className="input"
                            type="number"
                            placeholder="0"
                            value={quoteForm.materialCost}
                            onChange={e => setQuoteForm({ ...quoteForm, materialCost: +e.target.value })}
                          />
                        </div>
                      </div>
                      {(quoteForm.laborCost > 0 || quoteForm.materialCost > 0) && (
                        <div className="bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center">
                          <span className="text-sm text-blue-700">Total HT estimé</span>
                          <span className="font-bold text-blue-700">
                            {((+quoteForm.laborCost || 0) + (+quoteForm.materialCost || 0)).toLocaleString('fr-FR')} €
                          </span>
                        </div>
                      )}
                      <div>
                        <label className="label">Notes pour le client</label>
                        <textarea
                          className="input h-24 resize-none"
                          placeholder="Décrivez votre approche, les délais, etc."
                          value={quoteForm.notes}
                          onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => sendQuote(selectedLead.id)}
                          className="btn-primary text-sm flex-1 flex items-center justify-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Envoyer le devis
                        </button>
                        <button
                          onClick={() => setQuoteForm(null)}
                          className="btn-outline text-sm px-4"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQuoteForm({
                        requestId: selectedLead.id,
                        laborCost: '',
                        materialCost: '',
                        vatRate: 20,
                        notes: '',
                      })}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Rédiger un devis
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-green-800 text-sm">Devis déjà envoyé</div>
                    <div className="text-xs text-green-600">
                      Vous avez déjà soumis un devis pour cette demande.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utilisé dans la section "devis envoyés" pour filtrer les installations actives
const IN_PROGRESS_STATUSES = ['QUOTE_ACCEPTED', 'INSTALLATION', 'MISE_EN_SERVICE'];