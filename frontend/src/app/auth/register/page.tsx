'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Zap, User, Building2, Search, CheckCircle,
  XCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { verifyQualifelec, type QualifelecResult } from '@/lib/qualifelec';
import toast from 'react-hot-toast';

type Role = 'CLIENT' | 'INSTALLER';
type QualiStatus = 'idle' | 'loading' | 'ok' | 'error';

const IS_DEV =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_QUALIFELEC_DEV_MODE === 'true';

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole =
    params.get('role') === 'INSTALLER' ? 'INSTALLER' : 'CLIENT';

  const [role, setRole]           = useState<Role>(defaultRole as Role);
  const [form, setForm]           = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });
  const [siret, setSiret]         = useState('');
  const [qualiStatus, setQualiStatus] = useState<QualiStatus>('idle');
  const [qualiResult, setQualiResult] = useState<QualifelecResult | null>(null);
  const [loading, setLoading]     = useState(false);

  // ── Réinitialise le bloc installateur quand on change de rôle ──────────────
  const switchRole = (r: Role) => {
    setRole(r);
    setSiret('');
    setQualiStatus('idle');
    setQualiResult(null);
  };

  // ── Vérifie le SIRET via le service Qualifelec ────────────────────────────
  const checkQualifelec = async () => {
    const clean = siret.replace(/\s/g, '');
    if (clean.length !== 14) {
      toast.error('Le SIRET doit contenir exactement 14 chiffres.');
      return;
    }
    setQualiStatus('loading');
    setQualiResult(null);
    const result = await verifyQualifelec(clean);
    setQualiResult(result);
    setQualiStatus(result.valid ? 'ok' : 'error');
  };

  // ── Soumission ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'INSTALLER' && qualiStatus !== 'ok') {
      toast.error('Vérifiez votre qualification Qualifelec IRVE avant de continuer.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { ...form, role };
      if (role === 'INSTALLER') {
        payload.siret                = siret.replace(/\s/g, '');
        payload.qualifelecCertNumber = qualiResult?.certNumber;
        payload.qualifelecIndices    = qualiResult?.indices;
        payload.qualifelecExpiresAt  = qualiResult?.expiresAt;
      }

      const { data } = await authApi.register(payload);
      localStorage.setItem('irve_token', data.token);
      localStorage.setItem('irve_user', JSON.stringify(data.user));
      toast.success('Compte créé !');
      router.push(role === 'INSTALLER' ? '/dashboard/installer' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const siretFormatted = siret
    .replace(/\s/g, '')
    .replace(/(.{3})(.{3})(.{3})(.{5})/, '$1 $2 $3 $4');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary">
            <Zap className="w-7 h-7" />IRVE Platform
          </Link>
          <h1 className="text-2xl font-bold mt-4">Créer un compte</h1>
        </div>

        {/* Sélecteur de rôle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([
            { v: 'CLIENT',    label: 'Particulier / Entreprise', Icon: User },
            { v: 'INSTALLER', label: 'Installateur IRVE',        Icon: Building2 },
          ] as const).map(({ v, label, Icon }) => (
            <button
              key={v}
              onClick={() => switchRole(v)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                ${role === v
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <Icon className={`w-6 h-6 ${role === v ? 'text-primary' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${role === v ? 'text-primary' : 'text-gray-600'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="card space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Champs communs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom</label>
                <input className="input" value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="label">Nom</label>
                <input className="input" value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" type="tel" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input className="input" type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required minLength={8} />
            </div>

            {/* ── Bloc installateur uniquement ──────────────────────────────── */}
            {role === 'INSTALLER' && (
              <div className="border-t border-gray-100 pt-4 space-y-3">

                {/* En-tête section */}
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 className="w-4 h-4 text-primary" />
                  Vérification Qualifelec IRVE
                  {IS_DEV && (
                    <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-normal">
                      MODE DEV
                    </span>
                  )}
                </div>

                {/* Hint dev : le mock accepte n'importe quel SIRET valide */}
                {/* {IS_DEV && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 space-y-1">
                    <p className="font-semibold">🧪 Mode développement actif</p>
                    <p>
                      Tout SIRET de 14 chiffres sera vérifié contre le mock GitHub officiel
                      (datagouv). Le payload retourne toujours des indices IRVE valides.
                    </p>
                    <p>
                      Pour simuler un refus, modifiez <code className="bg-yellow-100 px-1 rounded">MOCK_URL</code>{' '}
                      dans <code className="bg-yellow-100 px-1 rounded">lib/qualifelec.ts</code>.
                    </p>
                  </div>
                )} */}

                {/* Champ SIRET */}
                <div>
                  <label className="label">Numéro SIRET (14 chiffres)</label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 font-mono tracking-widest"
                      value={siretFormatted}
                      onChange={e => {
                        const raw = e.target.value.replace(/\s/g, '').slice(0, 14);
                        setSiret(raw);
                        setQualiStatus('idle');
                        setQualiResult(null);
                      }}
                      placeholder="123 456 789 01234"
                      maxLength={17}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      onClick={checkQualifelec}
                      disabled={
                        siret.replace(/\s/g, '').length !== 14 ||
                        qualiStatus === 'loading'
                      }
                      className="btn-outline flex items-center gap-1.5 text-sm px-3 disabled:opacity-40 flex-shrink-0"
                    >
                      {qualiStatus === 'loading'
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Search className="w-4 h-4" />
                      }
                      Vérifier
                    </button>
                  </div>
                </div>

                {/* Résultat de vérification */}
                {qualiResult && (
                  <div className={`rounded-xl border p-3 flex items-start gap-3
                    ${qualiResult.valid
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'}`}
                  >
                    {qualiResult.valid
                      ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      : <XCircle    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className={`text-sm font-medium ${qualiResult.valid ? 'text-green-800' : 'text-red-700'}`}>
                        {qualiResult.message}
                      </p>
                      {qualiResult.valid && (
                        <div className="mt-1.5 space-y-0.5 text-xs text-green-700">
                          <p>N° certificat : <strong>{qualiResult.certNumber}</strong></p>
                          <p>
                            Expire le :{' '}
                            <strong>
                              {qualiResult.expiresAt
                                ? new Date(qualiResult.expiresAt).toLocaleDateString('fr-FR')
                                : '—'}
                            </strong>
                          </p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {qualiResult.indices?.map(i => (
                              <span
                                key={i}
                                className="bg-green-200 text-green-900 px-2 py-0.5 rounded-full text-xs font-semibold"
                              >
                                {i}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {!qualiResult.valid && (
                        <p className="text-xs text-red-600 mt-1">
                          Seules les entreprises qualifiées IRVE par Qualifelec peuvent s'inscrire
                          en tant qu'installateur.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Avertissement si pas encore vérifié */}
                {qualiStatus === 'idle' && (
                  <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                    <p>
                      La vérification Qualifelec est <strong>obligatoire</strong>.
                      Seules les entreprises avec une qualification IRVE active sont autorisées.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (role === 'INSTALLER' && qualiStatus !== 'ok')}
              className="btn-primary w-full py-2.5 disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>

            {role === 'INSTALLER' && qualiStatus !== 'ok' && (
              <p className="text-xs text-center text-gray-400">
                Vérifiez d'abord votre qualification IRVE pour activer le bouton
              </p>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-primary font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}