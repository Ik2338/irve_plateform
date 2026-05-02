'use client';
import { useState } from 'react';
import { Star, Send, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface LeaveReviewProps {
  requestId: string;
  installerId: string;
  installerName: string;
  onSuccess?: () => void;
}

export function LeaveReview({ requestId, installerId, installerName, onSuccess }: LeaveReviewProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) { toast.error('Veuillez donner une note'); return; }
    setSubmitting(true);
    try {
      await api.post('/reviews', { requestId, installerId, rating, comment });
      toast.success('Avis publié, merci !');
      setDone(true);
      onSuccess?.();
    } catch {
      toast.error('Erreur lors de la publication');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="card border-green-200 bg-green-50 flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
      <p className="text-sm text-green-700">Votre avis a été publié sur le profil de {installerName}.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-1">Laisser un avis</h3>
      <p className="text-sm text-gray-500 mb-4">Comment s'est passée votre installation avec {installerName} ?</p>

      {/* Étoiles */}
      <div className="flex gap-1 mb-4">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            className="transition-transform hover:scale-110">
            <Star className={`w-8 h-8 transition-colors ${s <= (hovered || rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-200'}`} />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-600 self-center">
            {['', 'Très déçu', 'Déçu', 'Correct', 'Satisfait', 'Excellent !'][rating]}
          </span>
        )}
      </div>

      <textarea
        className="input h-24 resize-none text-sm"
        placeholder="Décrivez votre expérience (optionnel)..."
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      <button onClick={submit} disabled={submitting || !rating}
        className="btn-primary mt-3 flex items-center gap-2 text-sm disabled:opacity-50">
        <Send className="w-4 h-4" />
        {submitting ? 'Publication...' : 'Publier l\'avis'}
      </button>
    </div>
  );
}

// ─── Liste d'avis (pour la page publique installateur) ─────────────────────
interface ReviewListProps {
  reviews: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user?: { firstName: string; lastName: string };
  }[];
  totalReviews: number;
  averageRating?: number;
}

export function ReviewList({ reviews, totalReviews, averageRating }: ReviewListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? reviews : reviews.slice(0, 3);

  if (reviews.length === 0) return (
    <div className="card text-center py-8 text-gray-400 text-sm">
      Aucun avis pour le moment.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* En-tête avec moyenne */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Avis clients ({totalReviews})</h3>
        {averageRating && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="font-semibold text-gray-800">{averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {displayed.map(r => (
          <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center">
                  {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {r.user?.firstName} {r.user?.lastName?.[0]}.
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            {r.comment && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>}
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <button onClick={() => setShowAll(v => !v)}
          className="mt-4 text-sm text-primary hover:underline w-full text-center">
          {showAll ? 'Voir moins' : `Voir tous les ${totalReviews} avis`}
        </button>
      )}
    </div>
  );
}