'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || null;

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Message d'erreur affiché dans l'UI (pas seulement toast)
  const [errorMsg, setErrorMsg] = useState('');

  // Si déjà connecté → rediriger directement
  useEffect(() => {
    try {
      const raw = localStorage.getItem('irve_user');
      if (!raw) return;
      const user = JSON.parse(raw);
      if (user.role === 'ADMIN')     { router.replace('/admin');              return; }
      if (user.role === 'INSTALLER') { router.replace('/dashboard/installer'); return; }
      router.replace('/dashboard');
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation basique côté client
    if (!form.email.trim()) {
      setErrorMsg('Veuillez saisir votre adresse email.');
      return;
    }
    if (!form.password) {
      setErrorMsg('Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.login(form);

      // Stockage sécurisé du token et des infos utilisateur
      const token = data.token || data.accessToken;
      localStorage.setItem('irve_token', token);
      localStorage.setItem('irve_user', JSON.stringify(data.user));

      toast.success(`Bienvenue, ${data.user.firstName} !`);

      // Redirection selon le rôle (ou vers la page demandée avant login)
      if (redirect) {
        router.push(redirect);
        return;
      }
      if (data.user.role === 'ADMIN')     { router.push('/admin');               return; }
      if (data.user.role === 'INSTALLER') { router.push('/dashboard/installer');  return; }
      router.push('/dashboard');

    } catch (err: any) {
      // Récupération du message d'erreur précis depuis l'API
      const status  = err?.response?.status;
      const apiMsg  = err?.response?.data?.message;

      let msg = 'Une erreur est survenue. Veuillez réessayer.';

      if (status === 401 || status === 400) {
        msg = 'Email ou mot de passe incorrect.';
      } else if (status === 403) {
        msg = apiMsg || 'Votre compte a été désactivé. Contactez le support.';
      } else if (status === 404) {
        msg = 'Aucun compte trouvé avec cette adresse email.';
      } else if (status === 429) {
        msg = 'Trop de tentatives. Veuillez patienter quelques minutes.';
      } else if (!navigator.onLine) {
        msg = 'Vous semblez hors ligne. Vérifiez votre connexion Internet.';
      } else if (apiMsg) {
        msg = apiMsg;
      }

      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary">
            <Zap className="w-7 h-7" />IRVE Platform
          </Link>
          <h1 className="text-2xl font-bold mt-4 text-gray-900">Connexion</h1>
          <p className="text-sm text-gray-500 mt-1">Accédez à votre espace</p>
        </div>

        {/* Message d'erreur visible */}
        {errorMsg && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulaire */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />Email
              </label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setErrorMsg(''); }}
                placeholder="votre@email.com"
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />Mot de passe
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setErrorMsg(''); }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Soumettre */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Connexion en cours...
                  </>
                : 'Se connecter'
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}