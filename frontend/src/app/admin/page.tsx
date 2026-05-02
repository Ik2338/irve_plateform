'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap, Users, Building2, FileText, CheckCircle, XCircle,
  Shield, LogOut, BarChart3, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { STATUS_LABELS } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'stats' | 'installers' | 'users' | 'requests';

const PAGE_SIZE = 10;

interface PaginatedState<T> {
  data: T[];
  page: number;
  total: number;
  loading: boolean;
}

function usePaginated<T>(fetcher: (page: number) => Promise<any>) {
  const [state, setState] = useState<PaginatedState<T>>({
    data: [], page: 1, total: 0, loading: false,
  });

  const load = useCallback(async (page: number) => {
    setState(s => ({ ...s, loading: true }));
    try {
      const { data } = await fetcher(page);
      setState({ data: data.data ?? data, page, total: data.total ?? data.length, loading: false });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [fetcher]);

  const goTo = (page: number) => load(page);
  return { ...state, goTo, reload: () => load(state.page) };
}

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-500">{total} résultat{total > 1 ? 's' : ''}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === pages}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const installers = usePaginated<any>(adminApi.installers);
  const users = usePaginated<any>(adminApi.users);
  const requests = usePaginated<any>(adminApi.requests);

  useEffect(() => {
    // ── Protection de route ──
    try {
      const raw = localStorage.getItem('irve_user');
      if (!raw) { router.replace('/auth/login'); return; }
      const user = JSON.parse(raw);
      if (user.role !== 'ADMIN') {
        // Redirige vers le bon dashboard selon le rôle
        if (user.role === 'INSTALLER') router.replace('/dashboard/installer');
        else router.replace('/dashboard');
        return;
      }
    } catch {
      router.replace('/auth/login');
      return;
    }

    setAuthChecked(true);

    setStatsLoading(true);
    adminApi.stats().then(({ data }) => setStats(data)).finally(() => setStatsLoading(false));
    installers.goTo(1);
    users.goTo(1);
    requests.goTo(1);
  }, []);

  const verify = async (id: string) => {
    await adminApi.verifyInstaller(id);
    toast.success('Installateur vérifié !');
    installers.reload();
    adminApi.stats().then(({ data }) => setStats(data));
  };

  const deactivate = async (id: string) => {
    await adminApi.deactivateInstaller(id);
    toast.success('Installateur désactivé');
    installers.reload();
  };

  const logout = () => { localStorage.clear(); router.push('/'); };

  const tabs: { key: Tab; label: string; Icon: any }[] = [
    { key: 'stats', label: 'Vue globale', Icon: BarChart3 },
    { key: 'installers', label: 'Installateurs', Icon: Building2 },
    { key: 'users', label: 'Utilisateurs', Icon: Users },
    { key: 'requests', label: 'Demandes', Icon: FileText },
  ];

  // Affiche un spinner pendant la vérification auth ou le chargement des stats
  if (!authChecked || (statsLoading && tab === 'stats')) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Logo → retourne sur la page admin, pas sur / */}
          <Link href="/admin" className="flex items-center gap-2 font-bold text-primary">
            <Zap className="w-5 h-5" />IRVE Platform
          </Link>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            Admin
          </span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
          <LogOut className="w-4 h-4" />Déconnexion
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border rounded-xl p-1 mb-8 w-fit shadow-sm">
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── STATS ── */}
        {tab === 'stats' && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Utilisateurs', value: stats.totals.users, Icon: Users },
                { label: 'Installateurs', value: stats.totals.installers, Icon: Building2 },
                { label: 'Demandes', value: stats.totals.requests, Icon: FileText },
                { label: 'Devis', value: stats.totals.quotes, Icon: CheckCircle },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="card flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-gray-500">{label}</div>
                  </div>
                </div>
              ))}
            </div>
            {stats.pendingInstallers > 0 && (
              <div className="card border-orange-200 bg-orange-50 flex items-center gap-3">
                <Shield className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <p className="text-sm text-orange-700">
                  <strong>{stats.pendingInstallers}</strong> installateur(s) en attente de vérification.
                </p>
                <button onClick={() => setTab('installers')} className="ml-auto text-sm text-orange-700 font-medium underline">
                  Voir
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── INSTALLERS ── */}
        {tab === 'installers' && (
          <div>
            {installers.loading
              ? <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" /></div>
              : <>
                  <div className="space-y-3">
                    {installers.data.map((inst) => (
                      <div key={inst.id} className="card flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium">{inst.companyName}</span>
                            {inst.isVerified
                              ? <span className="badge-green flex items-center gap-0.5"><Shield className="w-3 h-3" />Vérifié</span>
                              : <span className="badge-orange">En attente</span>}
                            {!inst.isActive && <span className="bg-red-100 text-red-700 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">Inactif</span>}
                          </div>
                          <div className="text-sm text-gray-500">{inst.user?.firstName} {inst.user?.lastName} · {inst.user?.email}</div>
                          <div className="text-xs text-gray-400">SIRET: {inst.siret} · {inst.certifications?.length || 0} certification(s)</div>
                        </div>
                        <div className="flex gap-2">
                          {!inst.isVerified && (
                            <button onClick={() => verify(inst.id)} className="btn-primary text-sm flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />Valider
                            </button>
                          )}
                          {inst.isActive && (
                            <button onClick={() => deactivate(inst.id)} className="btn-outline text-sm flex items-center gap-1 text-red-500 border-red-300">
                              <XCircle className="w-3 h-3" />Désactiver
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination page={installers.page} total={installers.total} onPage={installers.goTo} />
                </>
            }
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div>
            {users.loading
              ? <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" /></div>
              : <>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-xl border border-gray-100">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>{['Nom', 'Email', 'Rôle', 'Inscrit le'].map(h => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.data.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                            <td className="px-4 py-3 text-gray-500">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={u.role === 'ADMIN' ? 'badge-blue' : u.role === 'INSTALLER' ? 'badge-green' : 'badge-orange'}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={users.page} total={users.total} onPage={users.goTo} />
                </>
            }
          </div>
        )}

        {/* ── REQUESTS ── */}
        {tab === 'requests' && (
          <div>
            {requests.loading
              ? <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" /></div>
              : <>
                  <div className="space-y-3">
                    {requests.data.map((r) => (
                      <div key={r.id} className="card flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium">{r.projectType} – {r.powerLevel}</span>
                            <span className="badge-blue">{STATUS_LABELS[r.status as any] || r.status}</span>
                          </div>
                          <div className="text-sm text-gray-500">{r.address}, {r.city} · {r.user?.firstName} {r.user?.lastName}</div>
                          <div className="text-xs text-gray-400">{r.quotes?.length || 0} devis · {new Date(r.createdAt).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination page={requests.page} total={requests.total} onPage={requests.goTo} />
                </>
            }
          </div>
        )}
      </div>
    </div>
  );
}