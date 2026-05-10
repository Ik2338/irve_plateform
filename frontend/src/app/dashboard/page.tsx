'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientNav from '@/components/ClientNav';
import { Plus, FileText, Clock, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { requestsApi, quotesApi } from '@/lib/api';
import {
  STATUS_LABELS,
  PIPELINE_STEPS,
  getPipelineStep,
  PROJECT_TYPE_LABELS,
  POWER_LEVEL_SHORT,
  type RequestStatus,
  type ProjectType,
  type PowerLevel,
} from '@/types';
import toast from 'react-hot-toast';

// ─── Badge de statut ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  DRAFT:           'badge-orange',
  SUBMITTED:       'badge-blue',
  MATCHED:         'badge-blue',
  ETUDE_TECHNIQUE: 'badge-blue',
  DOSSIER_AG:      'badge-orange',
  QUOTE_SENT:      'badge-orange',
  QUOTE_ACCEPTED:  'badge-green',
  INSTALLATION:    'badge-blue',
  MISE_EN_SERVICE: 'badge-blue',
  MAINTENANCE:     'badge-green',
  COMPLETED:       'badge-green',
  CANCELLED:       'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500',
};

// Statuts où la suppression est interdite (trop avancé)
const NON_DELETABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

// ─── Modal de confirmation ────────────────────────────────────────────────────
function ConfirmDeleteModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Supprimer la demande ?</h3>
          <p className="text-sm text-gray-500">
            Cette action est irréversible. La demande et tous les devis associés seront définitivement supprimés.
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 btn-outline text-sm py-2"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline visuel pour une demande ─────────────────────────────────────────
function RequestPipeline({ status }: { status: RequestStatus }) {
  const currentStepIndex = getPipelineStep(status);
  const isCancelled = status === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        Demande annulée
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-3">
      {PIPELINE_STEPS.map((s, i) => {
        const done    = i < currentStepIndex;
        const active  = i === currentStepIndex;
        return (
          <div key={s.key} className="flex items-center gap-1 flex-1">
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-full transition-all
                ${done   ? 'bg-green-500'
                : active ? 'bg-primary ring-2 ring-primary/25'
                : 'bg-gray-200'}`}
              />
              <span className={`text-[10px] font-medium text-center leading-tight hidden sm:block
                ${done   ? 'text-green-600'
                : active ? 'text-primary'
                : 'text-gray-300'}`}>
                {s.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={`h-0.5 w-full max-w-[24px] flex-shrink-0 -mt-3.5
                ${done ? 'bg-green-400' : 'bg-gray-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [quotes, setQuotes]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  // État pour le modal de suppression
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('irve_user');
    if (!u) { router.push('/auth/login'); return; }
    Promise.all([requestsApi.list(), quotesApi.forClient()])
      .then(([r, q]) => { setRequests(r.data); setQuotes(q.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await requestsApi.remove(deleteTarget);
      setRequests(prev => prev.filter(r => r.id !== deleteTarget));
      toast.success('Demande supprimée');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const activeRequests    = requests.filter(r => !['COMPLETED', 'CANCELLED'].includes(r.status));
  const completedRequests = requests.filter(r => r.status === 'COMPLETED');
  const pendingQuotes     = quotes.filter(q => q.status === 'SENT');

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav />

      {/* Modal de confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Demandes actives', value: activeRequests.length,    Icon: FileText    },
            { label: 'Devis en attente', value: pendingQuotes.length,     Icon: Clock       },
            { label: 'Terminées',        value: completedRequests.length, Icon: CheckCircle },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Demandes ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mes demandes</h2>
          <Link href="/requests/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Nouvelle demande
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            Aucune demande.{' '}
            <Link href="/requests/new" className="text-primary font-medium hover:underline">
              Créez-en une !
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {requests.map(r => {
              const canDelete = !NON_DELETABLE_STATUSES.includes(r.status);
              return (
                <div key={r.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Titre */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {PROJECT_TYPE_LABELS[r.projectType as ProjectType] || r.projectType}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-600">
                          {POWER_LEVEL_SHORT[r.powerLevel as PowerLevel] || r.powerLevel}
                        </span>
                      </div>
                      {/* Adresse */}
                      <p className="text-sm text-gray-500 mt-0.5">{r.address}, {r.city}</p>
                      {/* Compteur devis */}
                      {r.quotes?.length > 0 && (
                        <p className="text-xs text-accent-dark mt-1 font-medium">
                          {r.quotes.length} devis reçu{r.quotes.length > 1 ? 's' : ''}
                        </p>
                      )}
                      {/* Pipeline 5 étapes */}
                      <RequestPipeline status={r.status as RequestStatus} />
                    </div>

                    {/* Droite : badge + bouton supprimer */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`${STATUS_COLORS[r.status] || 'badge-blue'}`}>
                        {STATUS_LABELS[r.status as RequestStatus] || r.status}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(r.id)}
                          title="Supprimer la demande"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Devis reçus ── */}
        {quotes.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">Mes devis reçus</h2>
            <div className="space-y-3">
              {quotes.map(q => (
                <div key={q.id} className="card flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{q.installer?.companyName}</div>
                    <div className="text-sm text-gray-500">{q.installer?.city}</div>
                    <div className="text-lg font-bold text-primary mt-1">
                      {q.amount?.toLocaleString('fr-FR')} €{' '}
                      <span className="text-sm font-normal text-gray-500">HT</span>
                    </div>
                  </div>
                  {q.status === 'SENT' ? (
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      <button
                        className="btn-primary text-sm px-3 py-1.5"
                        onClick={() =>
                          quotesApi.accept(q.id).then(() => {
                            toast.success('Devis accepté !');
                            location.reload();
                          })
                        }
                      >
                        Accepter
                      </button>
                      <button
                        className="btn-outline text-sm px-3 py-1.5"
                        onClick={() =>
                          quotesApi.refuse(q.id).then(() => {
                            toast.success('Devis refusé');
                            location.reload();
                          })
                        }
                      >
                        Refuser
                      </button>
                    </div>
                  ) : (
                    <span className="badge-blue flex-shrink-0">
                      {STATUS_LABELS[q.status as RequestStatus] || q.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}