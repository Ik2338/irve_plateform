'use client';
// app/auth/register/page.tsx
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Zap, User, Building2, Search, CheckCircle,
  XCircle, AlertCircle, Loader2, Mail, Lock, Phone, UserCircle, ArrowLeft,
  Eye, EyeOff  // 👈 Ajoutez Eye et EyeOff ici
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { verifyQualifelec, type QualifelecResult } from '@/lib/qualifelec';
import toast from 'react-hot-toast';

type Role = 'CLIENT' | 'INSTALLER';
type QualiStatus = 'idle' | 'loading' | 'ok' | 'error';

const IS_DEV =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_QUALIFELEC_DEV_MODE === 'true';

function RegisterPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = params.get('role') === 'INSTALLER' ? 'INSTALLER' : 'CLIENT';
  const redirect = params.get('redirect') || null;
  const safeRedirect = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : null;
  const loginHref = safeRedirect
    ? `/auth/login?redirect=${encodeURIComponent(safeRedirect)}`
    : '/auth/login';

  const [role, setRole]               = useState<Role>(defaultRole as Role);
  const [form, setForm]               = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });
  const [siret, setSiret]             = useState('');
  const [qualiStatus, setQualiStatus] = useState<QualiStatus>('idle');
  const [qualiResult, setQualiResult] = useState<QualifelecResult | null>(null);
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 Ajoutez cette ligne

  const switchRole = (r: Role) => {
    setRole(r);
    setSiret('');
    setQualiStatus('idle');
    setQualiResult(null);
  };

  const checkQualifelec = async () => {
    const clean = siret.replace(/\s/g, '');
    if (clean.length !== 14) { toast.error('Le SIRET doit contenir exactement 14 chiffres.'); return; }
    setQualiStatus('loading');
    setQualiResult(null);
    const result = await verifyQualifelec(clean);
    setQualiResult(result);
    setQualiStatus(result.valid ? 'ok' : 'error');
  };

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

      await authApi.register(payload);

      toast.success('Compte créé ! Vérifiez votre email pour activer votre compte.');
      if (safeRedirect) {
        localStorage.setItem('irve_after_verify_redirect', safeRedirect);
      }
      router.push(
        safeRedirect
          ? `/auth/verify-email?redirect=${encodeURIComponent(safeRedirect)}`
          : '/auth/verify-email'
      );

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
              Rejoignez la<br />
              communauté IRVE
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Que vous soyez particulier ou installateur certifié,<br />
              trouvez la solution idéale pour vos projets.
            </p>
            
            <div className="flex gap-4 pt-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-white/80 text-sm">Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-white/80 text-sm">Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-white/80 text-sm">Certifié</span>
              </div>
            </div>
          </div>
          
          <div className="text-white/60 text-sm">
            © 2024 IRVE Platform. Tous droits réservés.
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
            <p className="text-gray-600">
              Rejoignez notre plateforme en quelques clics
            </p>
          </div>

          {/* Sélecteur de rôle */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {([
              { v: 'CLIENT', label: 'Particulier / Entreprise', Icon: User },
              { v: 'INSTALLER', label: 'Installateur IRVE', Icon: Building2 },
            ] as const).map(({ v, label, Icon }) => (
              <button
                key={v}
                onClick={() => switchRole(v)}
                className={`p-4 rounded-xl border-2 transition-all text-center
                  ${role === v
                    ? 'border-primary bg-primary-light shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${role === v ? 'text-primary' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${role === v ? 'text-primary' : 'text-gray-600'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Prénom & Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })} 
                  required 
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
                  type="email" 
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} 
                  required 
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
                  type="tel" 
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} 
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required 
                  minLength={8} 
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
            </div>

            {/* Bloc installateur */}
            {role === 'INSTALLER' && (
              <div className="border-t border-gray-200 pt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 className="w-4 h-4 text-primary" />
                  Vérification Qualifelec IRVE
                  
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Numéro SIRET (14 chiffres)</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                      disabled={siret.replace(/\s/g, '').length !== 14 || qualiStatus === 'loading'}
                      className="px-4 py-3 border border-primary text-primary rounded-xl font-medium hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      {qualiStatus === 'loading'
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Search className="w-4 h-4" />
                      }
                      Vérifier
                    </button>
                  </div>
                </div>

                {qualiResult && (
                  <div className={`rounded-xl border p-4 flex items-start gap-3
                    ${qualiResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
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
                        <div className="mt-2 space-y-1 text-xs text-green-700">
                          <p>N° certificat : <strong className="font-mono">{qualiResult.certNumber}</strong></p>
                          <p>Expire le : <strong>{qualiResult.expiresAt ? new Date(qualiResult.expiresAt).toLocaleDateString('fr-FR') : '—'}</strong></p>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {qualiResult.indices?.map(i => (
                              <span key={i} className="bg-green-200 text-green-900 px-2 py-0.5 rounded-full text-xs font-semibold">{i}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {qualiStatus === 'idle' && (
                  <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                    <p>Vérification Qualifelec <strong>obligatoire</strong> - Seules les entreprises IRVE actives sont autorisées.</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (role === 'INSTALLER' && qualiStatus !== 'ok')}
              className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Création en cours...</>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Social Signup */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-500">Ou s'inscrire avec</span>
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
                <span className="text-sm font-medium text-gray-700"  >                 Google                  </span>
              </button>
              
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Déjà un compte ?{' '}
            <Link href={loginHref} className="text-primary font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#e8f0fe] via-white to-[#f0f4f8]" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
