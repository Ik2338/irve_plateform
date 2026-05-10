'use client';
// app/auth/forgot-password/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [email,    setEmail]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Veuillez saisir votre adresse email.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('sent');
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message || '';

      if (status === 429) {
        setErrorMsg('Trop de tentatives. Veuillez patienter quelques minutes.');
        toast.error('Trop de tentatives.');
      } else if (!navigator.onLine) {
        setErrorMsg('Vous semblez hors ligne. Vérifiez votre connexion Internet.');
      } else if (apiMsg && status !== 404) {
        setErrorMsg(apiMsg);
        toast.error(apiMsg);
      } else {
        // 404 → on passe quand même en "sent" (sécurité : ne pas révéler si l'email existe)
        setStep('sent');
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
              Mot de passe<br />oublié ?
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Pas d'inquiétude. Saisissez votre email<br />
              et nous vous enverrons un lien sécurisé.
            </p>
            <div className="flex gap-4 pt-8">
              {['Sécurisé', 'Rapide', 'Simple'].map(label => (
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
            © {new Date().getFullYear()} IRVE Platform. Tous droits réservés.
          </div>
        </div>
      </div>

      {/* ── Right : form / confirmation ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Back (mobile) */}
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

          {/* ── ÉTAPE 1 : formulaire ── */}
          {step === 'form' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Saisissez l'adresse email associée à votre compte.<br />
                  Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg p-4 mb-6 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                                 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                                 transition-all"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white rounded-xl py-3 font-semibold
                             hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
                    : 'Envoyer le lien de réinitialisation'
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

          {/* ── ÉTAPE 2 : email envoyé ── */}
          {step === 'sent' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé !</h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Si un compte est associé à{' '}
                  <span className="font-semibold text-gray-800">{email}</span>,
                  vous recevrez un email avec un lien de réinitialisation.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 text-left space-y-1.5">
                <p className="font-semibold">💡 Vous ne trouvez pas l'email ?</p>
                <p>Vérifiez votre dossier <strong>Spam</strong> ou <strong>Courrier indésirable</strong>.</p>
                <p>Le lien est valable <strong>1 heure</strong>.</p>
              </div>

              <button
                onClick={() => { setStep('form'); setErrorMsg(''); }}
                className="w-full text-sm font-medium text-gray-600 border border-gray-200
                           bg-white hover:bg-gray-50 rounded-xl py-3 transition-colors"
              >
                Modifier l'adresse email ou renvoyer
              </button>

              <p className="text-sm text-gray-500">
                <Link href="/auth/login" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Retour à la connexion
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}