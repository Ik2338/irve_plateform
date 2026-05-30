'use client';
// src/app/auth/verify-email/page.tsx
import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, CheckCircle, XCircle, Loader2, MailOpen, RefreshCw } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'expired';

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token');

  const [status,    setStatus]    = useState<Status>(token ? 'loading' : 'idle');
  const [message,   setMessage]   = useState('');
  const [email,     setEmail]     = useState('');
  const [resending, setResending] = useState(false);

  const called = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (called.current) return;
    called.current = true;

    authApi
      .verifyEmail(token)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
        if (data.token) localStorage.setItem('irve_token', data.token);
        setTimeout(() => router.push('/auth/login'), 3000);
      })
      .catch(err => {
        const msg = err?.response?.data?.message || '';
        setMessage(msg || 'Lien invalide ou expiré.');
        setStatus(msg.includes('expiré') ? 'expired' : 'error');
      });
  }, [token]);

  const handleResend = async () => {
    if (!email.trim()) { toast.error('Entrez votre adresse email.'); return; }
    setResending(true);
    try {
      await authApi.resendVerification(email);
      toast.success('Email renvoyé ! Vérifiez votre boîte mail.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du renvoi.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary">
            <Zap className="w-7 h-7" />IRVE Platform
          </Link>
        </div>

        <div className="card text-center space-y-6">

          {status === 'loading' && (
            <>
              <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vérification en cours…</h2>
                <p className="text-sm text-gray-500 mt-1">Patientez quelques instants.</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Email vérifié ! 🎉</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {message || 'Votre compte est activé. Redirection dans 3 secondes…'}
                </p>
              </div>
              <Link href="/auth/login" className="btn-primary w-full py-2.5 block">
                Se connecter maintenant
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <XCircle className="w-14 h-14 text-orange-400 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lien expiré</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ce lien n'est valable que 24 heures. Demandez-en un nouveau.
                </p>
              </div>
              <ResendBlock email={email} setEmail={setEmail} onResend={handleResend} resending={resending} />
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-14 h-14 text-red-500 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lien invalide</h2>
                <p className="text-sm text-gray-500 mt-1">{message}</p>
              </div>
              <ResendBlock email={email} setEmail={setEmail} onResend={handleResend} resending={resending} />
            </>
          )}

          {status === 'idle' && (
            <>
              <MailOpen className="w-14 h-14 text-primary mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vérifiez votre email</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Un lien d'activation a été envoyé à votre adresse.<br />
                  Cliquez sur le lien pour activer votre compte.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 text-left space-y-1">
                <p className="font-semibold">💡 Vous ne trouvez pas l'email ?</p>
                <p>Vérifiez votre dossier <strong>Spam</strong> ou <strong>Courrier indésirable</strong>.</p>
                <p>Le lien est valable <strong>24 heures</strong>.</p>
              </div>
              <ResendBlock email={email} setEmail={setEmail} onResend={handleResend} resending={resending} />
            </>
          )}

          <p className="text-sm text-gray-400">
            <Link href="/auth/login" className="hover:underline text-primary">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function ResendBlock({ email, setEmail, onResend, resending }: {
  email: string; setEmail: (v: string) => void; onResend: () => void; resending: boolean;
}) {
  return (
    <div className="space-y-2 text-left">
      <p className="text-sm text-gray-500 text-center">Renvoyer le lien de vérification :</p>
      <input
        className="input"
        type="email"
        placeholder="votre@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button
        onClick={onResend}
        disabled={resending}
        className="btn-outline w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {resending
          ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi…</>
          : <><RefreshCw className="w-4 h-4" />Renvoyer l'email</>
        }
      </button>
    </div>
  );
}
