'use client';
// app/auth/login/page.tsx
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Mail, Lock, AlertCircle, Eye, EyeOff, MailOpen, Loader2, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

function LoginPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') || null;

  const [form,         setForm]         = useState({ email: '', password: '' });
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [showResend,   setShowResend]   = useState(false);
  const [resending,    setResending]    = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);

  // Redirect si déjà connecté
  useEffect(() => {
    try {
      const raw = localStorage.getItem('irve_user');
      if (!raw) return;
      const user = JSON.parse(raw);
      if (user.role === 'ADMIN')     { router.replace('/admin');               return; }
      if (user.role === 'INSTALLER') { router.replace('/dashboard/installer'); return; }
      router.replace('/dashboard');
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setShowResend(false);

    if (!form.email.trim()) { setErrorMsg('Veuillez saisir votre adresse email.'); return; }
    if (!form.password)     { setErrorMsg('Veuillez saisir votre mot de passe.'); return; }

    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      const token = data.token || data.accessToken;
      localStorage.setItem('irve_token', token);
      localStorage.setItem('irve_user', JSON.stringify(data.user));
      if (rememberMe) {
        localStorage.setItem('remember_email', form.email);
      }
      toast.success(`Bienvenue, ${data.user.firstName} !`);

      if (redirect)                        { router.push(redirect);               return; }
      if (data.user.role === 'ADMIN')     { router.push('/admin');               return; }
      if (data.user.role === 'INSTALLER') { router.push('/dashboard/installer'); return; }
      router.push('/dashboard');

    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message || '';
      let msg = 'Une erreur est survenue. Veuillez réessayer.';

      if (apiMsg === 'EMAIL_NOT_VERIFIED') {
        msg = 'Votre adresse email n\'est pas encore vérifiée.';
        setShowResend(true);
      } else if (status === 401 || status === 400) {
        msg = 'Email ou mot de passe incorrect.';
      } else if (status === 403) {
        msg = apiMsg || 'Votre compte a été désactivé. Contactez le support.';
      } else if (status === 429) {
        msg = 'Trop de tentatives. Veuillez patienter quelques minutes.';
      } else if (!navigator.onLine) {
        msg = 'Vous semblez hors ligne. Vérifiez votre connexion Internet.';
      } else if (apiMsg) {
        msg = apiMsg;
      }

      setErrorMsg(msg);
      if (!showResend) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email.trim()) { toast.error('L\'adresse email est requise.'); return; }
    setResending(true);
    try {
      await authApi.resendVerification(form.email);
      toast.success('Email de vérification renvoyé ! Vérifiez votre boîte mail.');
      setShowResend(false);
      setErrorMsg('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du renvoi.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f0fe] via-white to-[#f0f4f8] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center gap-2 text-white text-2xl font-bold">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-6 h-6 text-white" />
            </div>
            IRVE Platform
          </Link>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Simplifiez votre<br />
              installation IRVE
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              La plateforme de mise en relation entre particuliers<br />
              et installateurs certifiés Qualifelec
            </p>
            
            <div className="flex gap-4 pt-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-white/80 text-sm">Certifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-white/80 text-sm">Rapide</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-white/80 text-sm">Sécurisé</span>
              </div>
            </div>
          </div>
          
          <div className="text-white/60 text-sm">
            © 2024 IRVE Platform. Tous droits réservés.
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back button for mobile */}
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8 lg:hidden transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
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

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
            <p className="text-gray-600">
              Accédez à votre espace personnel
            </p>
          </div>

          {/* Erreur générique */}
          {errorMsg && !showResend && (
            <div className="flex items-start gap-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg p-4 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bloc email non vérifié */}
          {showResend && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-start gap-3 text-amber-700">
                <MailOpen className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Email non vérifié</p>
                  <p className="text-xs mt-0.5 leading-relaxed">
                    Vérifiez votre boîte mail et cliquez sur le lien d'activation.
                  </p>
                </div>
              </div>
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full text-sm font-medium text-amber-700 border border-amber-300
                           bg-amber-100 hover:bg-amber-200 rounded-lg py-2 transition-colors
                           flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi…</>
                  : 'Renvoyer le lien de vérification'
                }
              </button>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setErrorMsg(''); setShowResend(false); }}
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setErrorMsg(''); }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                Se souvenir de moi
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Connexion en cours…</>
                : 'Se connecter'
              }
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Ou continuer avec</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Google</span>
              </button>
              
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-primary font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#e8f0fe] via-white to-[#f0f4f8]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
