'use client';
// app/auth/reset-password/ResetPasswordForm.tsx
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, ArrowLeft, Loader2, CheckCircle, AlertCircle,
  Eye, EyeOff, Lock,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

type Step = 'form' | 'success' | 'invalid';

const RULES = [
  { id: 'length',  label: 'Au moins 8 caractères',           test: (v: string) => v.length >= 8 },
  { id: 'upper',   label: 'Une majuscule',                    test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lower',   label: 'Une minuscule',                    test: (v: string) => /[a-z]/.test(v) },
  { id: 'number',  label: 'Un chiffre',                       test: (v: string) => /[0-9]/.test(v) },
  { id: 'special', label: 'Un caractère spécial (@$!%*?&…)',  test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function StrengthBar({ value }: { value: string }) {
  const passed = RULES.filter(r => r.test(value)).length;
  const pct    = value.length === 0 ? 0 : Math.round((passed / RULES.length) * 100);

  const color =
    pct === 0  ? 'bg-gray-200'    :
    pct <= 40  ? 'bg-red-400'     :
    pct <= 60  ? 'bg-yellow-400'  :
    pct <= 80  ? 'bg-blue-400'    :
                 'bg-green-500';

  const label =
    pct === 0  ? ''            :
    pct <= 40  ? 'Très faible' :
    pct <= 60  ? 'Faible'      :
    pct <= 80  ? 'Moyen'       :
                 'Fort';

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <p className={`text-xs font-medium ${
          pct <= 40 ? 'text-red-500'    :
          pct <= 60 ? 'text-yellow-600' :
          pct <= 80 ? 'text-blue-500'   :
                      'text-green-600'
        }`}>{label}</p>
      )}
    </div>
  );
}

export default function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCfm,  setShowCfm]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) setStep('invalid');
  }, [token]);

  const passwordOk = RULES.every(r => r.test(password));
  const confirmOk  = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!passwordOk) {
      setErrorMsg('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    if (!confirmOk) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setStep('success');
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message || '';

      if (status === 400 || status === 401) {
        setStep('invalid');
      } else if (status === 429) {
        setErrorMsg('Trop de tentatives. Veuillez patienter quelques minutes.');
        toast.error('Trop de tentatives.');
      } else if (!navigator.onLine) {
        setErrorMsg('Vous semblez hors ligne. Vérifiez votre connexion Internet.');
      } else if (apiMsg) {
        setErrorMsg(apiMsg);
        toast.error(apiMsg);
      } else {
        setErrorMsg('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f0fe] via-white to-[#f0f4f8] flex">

      {/* ── Left branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center gap-2 text-white text-2xl font-bold">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-6 h-6 text-white" />
            </div>
            IRVE Platform
          </Link>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Nouveau<br />mot de passe
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Choisissez un mot de passe fort<br />
              pour sécuriser votre compte.
            </p>
            <div className="flex gap-4 pt-8">
              {['Sécurisé', 'Chiffré', 'Protégé'].map(label => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <span className="text-white/80 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-white/60 text-sm">
  © <span suppressHydrationWarning>{new Date().getFullYear()}</span> IRVE Platform. Tous droits réservés.
</div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Back mobile */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8 lg:hidden transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>

          {/* Logo mobile */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary">
              <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              IRVE Platform
            </Link>
          </div>

          {/* ── Lien invalide ── */}
          {step === 'invalid' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ce lien de réinitialisation n'est plus valide.<br />
                  Il a peut-être déjà été utilisé ou a expiré après 1 heure.
                </p>
              </div>
              <Link
                href="/auth/forgot-password"
                className="w-full bg-primary text-white rounded-xl py-3 font-semibold
                           hover:bg-primary-dark transition-all flex items-center justify-center gap-2
                           shadow-lg shadow-primary/20"
              >
                Demander un nouveau lien
              </Link>
              <p className="text-sm text-gray-500">
                <Link href="/auth/login" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Retour à la connexion
                </Link>
              </p>
            </div>
          )}

          {/* ── Formulaire ── */}
          {step === 'form' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Saisissez et confirmez votre nouveau mot de passe.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg p-4 mb-6 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl
                                 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                                 transition-all"
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <StrengthBar value={password} />

                  {password.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {RULES.map(rule => {
                        const ok = rule.test(password);
                        return (
                          <li key={rule.id} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {ok ? '✓' : '·'}
                            </span>
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className={`w-full pl-10 pr-10 py-3 border rounded-xl
                                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                                  transition-all
                                  ${confirm.length > 0
                                    ? confirmOk
                                      ? 'border-green-400 bg-green-50/30'
                                      : 'border-red-300 bg-red-50/30'
                                    : 'border-gray-200'}`}
                      type={showCfm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setErrorMsg(''); }}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCfm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showCfm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirm.length > 0 && !confirmOk && (
                    <p className="mt-1.5 text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                  )}
                  {confirmOk && (
                    <p className="mt-1.5 text-xs text-green-600">✓ Les mots de passe correspondent.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white rounded-xl py-3 font-semibold
                             hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-2"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Mise à jour…</>
                    : 'Réinitialiser le mot de passe'
                  }
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-8">
                <Link href="/auth/login" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}

          {/* ── Succès ── */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe modifié !</h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Votre mot de passe a été réinitialisé avec succès.<br />
                  Vous pouvez maintenant vous connecter.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 text-left space-y-1.5">
                <p className="font-semibold">🔒 Conseil de sécurité</p>
                <p>Ne partagez jamais votre mot de passe et utilisez un gestionnaire de mots de passe.</p>
              </div>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-primary text-white rounded-xl py-3 font-semibold
                           hover:bg-primary-dark transition-all flex items-center justify-center gap-2
                           shadow-lg shadow-primary/20"
              >
                Se connecter
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}