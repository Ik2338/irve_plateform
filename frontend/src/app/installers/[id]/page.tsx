'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, MapPin, Star, Shield, CheckCircle, Award, Phone, Mail, Globe, ArrowLeft, FileText, Download } from 'lucide-react';
import { installersApi } from '@/lib/api';

const CERT_LABELS: Record<string, string> = {
  IRVE_P1: 'IRVE P1 — Installations ≤ 3,7 kW',
  IRVE_P2: 'IRVE P2 — Installations ≤ 22 kW',
  IRVE_P3: 'IRVE P3 — Infrastructures collectives',
};
const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise', COPROPRIETE: 'Copropriété',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function InstallerPublicPage() {
  const params = useParams();
  const [installer, setInstaller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params?.id as string;
    if (!id || !UUID_REGEX.test(id)) return;

    setLoading(true);
    installersApi.get(id)
      .then(({ data }) => setInstaller(data))
      .catch((err: any) => {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Impossible de charger le profil installateur.'
        );
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (error || !installer) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4">
      <div className="card max-w-sm w-full text-center py-10 space-y-3">
        <p className="text-red-600 font-medium">{error || 'Installateur introuvable.'}</p>
        <Link href="/installers/search" className="btn-outline text-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />Retour à la recherche
        </Link>
      </div>
    </div>
  );

  // URL de demande ciblée : passe l'id ET le nom de l'installateur
  const quoteUrl = `/requests/new?installerId=${installer.id}&installerName=${encodeURIComponent(installer.companyName)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        <Link href="/installers/search" className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary">
          <ArrowLeft className="w-4 h-4" />Retour à la recherche
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-black text-primary">{installer.companyName?.[0]}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{installer.companyName}</h1>
                  {installer.isVerified && (
                    <span className="badge-green flex items-center gap-1">
                      <Shield className="w-3 h-3" />Vérifié IRVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin className="w-3 h-3" />{installer.city} ({installer.postalCode})
                </div>
                {installer.averageRating && (
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(installer.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">
                      {installer.averageRating.toFixed(1)} ({installer.totalReviews} avis)
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Bouton → demande ciblée à CET installateur uniquement */}
            <Link href={quoteUrl} className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0">
              <FileText className="w-4 h-4" />Demander un devis
            </Link>
          </div>
          {installer.description && (
            <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
              {installer.description}
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="card">
          <h2 className="font-semibold mb-3 text-gray-700 text-sm">Contact</h2>
          <div className="space-y-2">
            {installer.user?.phone && (
              <a href={`tel:${installer.user.phone}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
                <Phone className="w-4 h-4 text-gray-400" />{installer.user.phone}
              </a>
            )}
            {installer.user?.email && (
              <a href={`mailto:${installer.user.email}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
                <Mail className="w-4 h-4 text-gray-400" />{installer.user.email}
              </a>
            )}
            {installer.website && (
              <a href={installer.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Globe className="w-4 h-4" />{installer.website}
              </a>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              Zone d'intervention : {installer.interventionRadius} km autour de {installer.city}
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="card">
          <h2 className="font-semibold mb-3 text-gray-700 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />Certifications IRVE
          </h2>
          {!installer.certifications?.length
            ? <p className="text-sm text-gray-400">Aucune certification enregistrée.</p>
            : (
              <div className="space-y-3">
                {installer.certifications.map((cert: any) => (
                  <div key={cert.id}
                    className={`flex items-center justify-between p-3 rounded-xl border
                      ${cert.isVerified ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold
                        ${cert.isVerified ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                        {cert.level.replace('IRVE_', '')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {CERT_LABELS[cert.level] || cert.level}
                        </div>
                        <div className="text-xs text-gray-500">N° {cert.certNumber}</div>
                        {cert.isVerified
                          ? (
                            <div className="text-xs text-green-700 flex items-center gap-1 mt-0.5">
                              <CheckCircle className="w-3 h-3" />
                              Vérifié · expire le {new Date(cert.expiresAt).toLocaleDateString('fr-FR')}
                            </div>
                          ) : (
                            <div className="text-xs text-orange-600">En cours de vérification</div>
                          )
                        }
                      </div>
                    </div>
                    {cert.documentUrl && cert.isVerified && (
                      <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer"
                        className="btn-outline text-xs px-2 py-1.5 flex items-center gap-1 flex-shrink-0">
                        <Download className="w-3 h-3" />Télécharger
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Types d'intervention */}
        {installer.projectTypes?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3 text-gray-700 text-sm">Types de projets</h2>
            <div className="flex flex-wrap gap-2">
              {installer.projectTypes.map((pt: any) => (
                <span key={pt.projectType} className="badge-blue">
                  {PROJ_LABELS[pt.projectType] || pt.projectType}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Avis */}
        {installer.reviews?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3 text-gray-700 text-sm">
              Avis clients ({installer.totalReviews})
            </h2>
            <div className="space-y-3">
              {installer.reviews.map((r: any) => (
                <div key={r.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="card bg-primary-light border-primary/20 text-center py-6">
          <h3 className="font-semibold text-gray-800 mb-1">Intéressé par cet installateur ?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Déposez votre demande — elle sera envoyée directement à <strong>{installer.companyName}</strong>.
          </p>
          <Link href={quoteUrl} className="btn-primary inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />Déposer une demande
          </Link>
        </div>
      </div>
    </div>
  );
}