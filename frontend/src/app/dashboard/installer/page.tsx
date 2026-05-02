'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallerNav from '@/components/InstallerNav';
import { MapPin, Send, Star, FileText, AlertCircle, X, Phone, Mail, User, Zap, Calendar, Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { matchingApi, quotesApi, installersApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function InstallerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('irve_user');
    if (!u) { router.push('/auth/login'); return; }
    Promise.all([matchingApi.leads(), quotesApi.forInstaller(), installersApi.myProfile()])
      .then(([l, q, p]) => { setLeads(l.data); setQuotes(q.data); setProfile(p.data); })
      .finally(() => setLoading(false));
  }, []);

  const sendQuote = async (requestId: string) => {
    try {
      await quotesApi.create({ requestId, ...quoteForm });
      toast.success('Devis envoyé !');
      setQuoteForm(null);
      const q = await quotesApi.forInstaller();
      setQuotes(q.data);
    } catch { toast.error('Erreur lors de l\'envoi'); }
  };

  const openLeadDetail = (lead: any) => {
    setSelectedLead(lead);
    setQuoteForm(null);
  };

  const closeModal = () => {
    setSelectedLead(null);
    setQuoteForm(null);
  };

  const alreadyQuoted = (leadId: string) =>
    quotes.some(q => q.requestId === leadId || q.request?.id === leadId);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <InstallerNav />
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Leads disponibles', value: leads.length, Icon: MapPin },
            { label: 'Devis envoyés', value: quotes.length, Icon: Send },
            { label: 'Devis acceptés', value: quotes.filter(q => q.status === 'ACCEPTED').length, Icon: Star },
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

        {/* Leads list */}
        <h2 className="text-lg font-semibold mb-4">Demandes dans ma zone</h2>
        {leads.length === 0
          ? <div className="card text-center py-8 text-gray-500 mb-8">Aucune demande dans votre zone pour le moment.</div>
          : (
            <div className="space-y-3 mb-8">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  className="card cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openLeadDetail(lead)}
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
          )
        }

        {/* Quotes list */}
        <h2 className="text-lg font-semibold mb-4">Mes devis envoyés</h2>
        {quotes.length === 0
          ? <div className="card text-center py-8 text-gray-500">Aucun devis envoyé.</div>
          : (
            <div className="space-y-3">
              {quotes.map(q => (
                <div key={q.id} className="card flex items-center justify-between">
                  <div>
                    <div className="font-medium">{q.request?.projectType} – {q.request?.powerLevel}</div>
                    <div className="text-sm text-gray-500">{q.request?.city}</div>
                    <div className="text-primary font-bold">{q.amount?.toLocaleString('fr-FR')} € HT</div>
                  </div>
                  <span className={
                    q.status === 'ACCEPTED'
                      ? 'badge-green'
                      : q.status === 'REFUSED'
                        ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
                        : 'badge-orange'
                  }>
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold">Détails de la demande</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Reçue le {new Date(selectedLead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">

              {/* Client Info */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Informations client</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {(selectedLead.clientName || selectedLead.user?.name) && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Nom</div>
                        <div className="font-medium text-sm">{selectedLead.clientName || selectedLead.user?.name}</div>
                      </div>
                    </div>
                  )}
                  {(selectedLead.clientEmail || selectedLead.user?.email) && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <a
                          href={`mailto:${selectedLead.clientEmail || selectedLead.user?.email}`}
                          className="font-medium text-sm text-primary hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {selectedLead.clientEmail || selectedLead.user?.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {(selectedLead.clientPhone || selectedLead.user?.phone) && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Téléphone</div>
                        <a
                          href={`tel:${selectedLead.clientPhone || selectedLead.user?.phone}`}
                          className="font-medium text-sm text-primary hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {selectedLead.clientPhone || selectedLead.user?.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Info */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Détails du projet</h4>
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
                        <span className="text-gray-400 text-xs ml-1">({parseFloat(selectedLead.distance_km || 0).toFixed(1)} km de vous)</span>
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
                          {new Date(selectedLead.desiredDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
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

              {/* Quote Form */}
              {!alreadyQuoted(selectedLead.id) ? (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Envoyer un devis</h4>
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
                      {quoteForm.laborCost > 0 || quoteForm.materialCost > 0 ? (
                        <div className="bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center">
                          <span className="text-sm text-blue-700">Total HT estimé</span>
                          <span className="font-bold text-blue-700">
                            {((+quoteForm.laborCost || 0) + (+quoteForm.materialCost || 0)).toLocaleString('fr-FR')} €
                          </span>
                        </div>
                      ) : null}
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
                      onClick={() => setQuoteForm({ requestId: selectedLead.id, laborCost: '', materialCost: '', vatRate: 20, notes: '' })}
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
                    <div className="text-xs text-green-600">Vous avez déjà soumis un devis pour cette demande.</div>
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