'use client';
import { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import { reviewsApi } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Hook : détecte la 1ère demande COMPLETED non encore évaluée ──────────────
export function usePendingRatingRequest(requests: any[]) {
  const [pending, setPending] = useState<any>(null);

  useEffect(() => {
    const dismissed: string[] = JSON.parse(
      localStorage.getItem('irve_dismissed_ratings') || '[]',
    );
    const found = requests.find(
      r => r.status === 'COMPLETED' && !dismissed.includes(r.id),
    );
    setPending(found ?? null);
  }, [requests]);

  const dismiss = (requestId: string) => {
    const dismissed: string[] = JSON.parse(
      localStorage.getItem('irve_dismissed_ratings') || '[]',
    );
    localStorage.setItem(
      'irve_dismissed_ratings',
      JSON.stringify([...dismissed, requestId]),
    );
    setPending(null);
  };

  return { pending, dismiss };
}

// ─── StarRating (lecture seule, à réutiliser sur la fiche installateur) ────────
export function StarRating({
  score,
  count,
}: {
  score?: number | null;
  count?: number;
}) {
  const s = score ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= Math.round(s)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      {count !== undefined && (
        <span className="text-xs text-gray-500 ml-1">
          {s.toFixed(1)} ({count} avis)
        </span>
      )}
    </div>
  );
}

const SCORE_LABELS = ['', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent !'];

// ─── RatingModal ──────────────────────────────────────────────────────────────
export function RatingModal({
  request,
  installerId,
  installerName,
  onDismiss,
}: {
  request: any;
  installerId: string;
  installerName?: string;
  onDismiss: () => void;
}) {
  const [score, setScore]     = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!score) { toast.error('Choisissez une note'); return; }
    setLoading(true);
    try {
      await reviewsApi.create({
        requestId: request.id,
        installerId,
        score,
        comment,
      });
      setDone(true);
      setTimeout(onDismiss, 2200);
    } catch {
      toast.error("Erreur lors de l'envoi de votre avis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        {/* Bouton fermer */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {done ? (
          /* ── État succès ── */
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold">Merci pour votre avis !</h3>
            <p className="text-sm text-gray-500 mt-2">
              Votre évaluation aide d'autres clients à choisir.
            </p>
          </div>
        ) : (
          /* ── Formulaire ── */
          <>
            <h3 className="text-lg font-semibold text-center mb-1">
              Évaluez votre installation
            </h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              {installerName ?? 'Votre installateur'}
            </p>

            {/* Étoiles interactives */}
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setScore(i)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      i <= (hover || score)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Label dynamique */}
            <div className="h-5 flex items-center justify-center mb-4">
              {(hover || score) > 0 && (
                <p className="text-sm font-semibold text-amber-600 animate-fade-in">
                  {SCORE_LABELS[hover || score]}
                </p>
              )}
            </div>

            <textarea
              className="input w-full h-20 resize-none text-sm mb-4"
              placeholder="Commentaire optionnel — délais, qualité, communication…"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 btn-outline text-sm py-2.5"
                disabled={loading}
              >
                Plus tard
              </button>
              <button
                onClick={submit}
                disabled={loading || score === 0}
                className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi…' : 'Envoyer mon avis'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}