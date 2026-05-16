'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, Search, MapPin, Star, Shield, ChevronRight, ChevronLeft,
  List, Map as MapIcon, Award, Phone, Mail, Globe, FileText,
  Download, CheckCircle, X, SlidersHorizontal, Filter,
} from 'lucide-react';
import { api, installersApi } from '@/lib/api';

// ─── Labels ───────────────────────────────────────────────────────────────────
const PROJECT_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'COPROPRIETE'];
const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise', COPROPRIETE: 'Copropriété',
};
const CERT_OPTIONS = ['IRVE_P1', 'IRVE_P2', 'IRVE_P3'];
const CERT_LABELS: Record<string, string> = {
  IRVE_P1: 'IRVE P1 — ≤ 3,7 kW',
  IRVE_P2: 'IRVE P2 — ≤ 22 kW',
  IRVE_P3: 'IRVE P3 — Infrastructures collectives',
};
const CERT_SHORT: Record<string, string> = { IRVE_P1: 'P1', IRVE_P2: 'P2', IRVE_P3: 'P3' };

// ─── Map Leaflet ──────────────────────────────────────────────────────────────
function InstallerMap({ results, onSelect }: { results: any[]; onSelect: (inst: any) => void }) {
  const mapRef   = useRef<any>(null);
  const mapElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapElRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css'; link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
      const L = (window as any).L;
      if (!mapElRef.current) return;
      const center = results.length > 0 && results[0].lat && results[0].lng
        ? [results[0].lat, results[0].lng] : [48.8566, 2.3522];
      const map = L.map(mapElRef.current).setView(center, 10);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#16a34a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:rotate(-45deg);"></div>`,
        iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
      });
      results.forEach(inst => {
        const lat = inst.lat ?? inst.latitude ?? null;
        const lng = inst.lng ?? inst.longitude ?? null;
        if (!lat || !lng) return;
        const popup = `
          <div style="min-width:180px;font-family:system-ui">
            <p style="font-weight:700;margin:0 0 4px">${inst.companyName}</p>
            ${inst.isVerified ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:99px;font-size:11px">✓ Vérifié IRVE</span>' : ''}
            <p style="color:#6b7280;font-size:12px;margin:6px 0">${inst.city} · ${parseFloat(inst.distance_km || 0).toFixed(1)} km</p>
            <button onclick="window.__selectInstaller('${inst.id}')" style="color:#16a34a;font-size:12px;font-weight:600;background:none;border:none;cursor:pointer;padding:0">Voir le profil →</button>
          </div>`;
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
      });
      (window as any).__selectInstaller = (id: string) => {
        const found = results.find(r => r.id === id);
        if (found) onSelect(found);
      };
      if (results.length > 1) {
        const valid = results.filter(r => (r.lat || r.latitude) && (r.lng || r.longitude));
        if (valid.length > 0) {
          const bounds = L.latLngBounds(valid.map((r: any) => [r.lat ?? r.latitude, r.lng ?? r.longitude]));
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    };
    loadLeaflet();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [results]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '480px' }}>
      <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
      {results.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 text-sm">Lancez une recherche pour voir les installateurs sur la carte</p>
        </div>
      )}
    </div>
  );
}

// ─── Panneau profil inline ─────────────────────────────────────────────────────
function InstallerProfile({
  installer, onClose, isLoggedIn,
}: {
  installer: any; onClose: () => void; isLoggedIn: boolean;
}) {
  const router = useRouter();
  const quoteUrl = `/requests/new?installerId=${installer.id}&installerName=${encodeURIComponent(installer.companyName)}`;

  const handleDevis = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem('irve_pending_installer', JSON.stringify({
        id: installer.id,
        name: installer.companyName,
      }));
      router.push(`/auth/login?redirect=${encodeURIComponent(quoteUrl)}`);
      return;
    }
    router.push(quoteUrl);
  };

  const goFullDevis = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem('irve_pending_installer', JSON.stringify({
        id: installer.id,
        name: installer.companyName,
      }));
      router.push(`/auth/login?redirect=${encodeURIComponent(quoteUrl)}`);
      return;
    }
    router.push(quoteUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center">
              <span className="text-xl font-black text-primary">{installer.companyName?.[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{installer.companyName}</h2>
                {installer.isVerified && (
                  <span className="badge-green flex items-center gap-1 text-xs">
                    <Shield className="w-3 h-3" />Vérifié IRVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin className="w-3 h-3" />{installer.city} ({installer.postalCode})
                {installer.distance_km && (
                  <span className="ml-1">· à {parseFloat(installer.distance_km).toFixed(1)} km</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* Note */}
          {installer.averageRating && (
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(installer.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
              <span className="text-sm text-gray-600 font-medium">
                {installer.averageRating.toFixed(1)} <span className="text-gray-400 font-normal">({installer.totalReviews} avis)</span>
              </span>
            </div>
          )}

          {/* Description */}
          {installer.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{installer.description}</p>
          )}

          {/* Contact */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
            {installer.user?.phone && (
              <a href={`tel:${installer.user.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
                <Phone className="w-4 h-4 text-gray-400" />{installer.user.phone}
              </a>
            )}
            {installer.user?.email && (
              <a href={`mailto:${installer.user.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
                <Mail className="w-4 h-4 text-gray-400" />{installer.user.email}
              </a>
            )}
            {installer.website && (
              <a href={installer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Globe className="w-4 h-4" />{installer.website}
              </a>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              Zone : {installer.interventionRadius} km autour de {installer.city}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" />Certifications IRVE
            </p>
            {!installer.certifications?.length
              ? <p className="text-sm text-gray-400">Aucune certification enregistrée.</p>
              : (
                <div className="space-y-2">
                  {installer.certifications.map((cert: any) => (
                    <div key={cert.id}
                      className={`flex items-center justify-between p-3 rounded-xl border
                        ${cert.isVerified ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold
                          ${cert.isVerified ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                          {cert.level.replace('IRVE_', '')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {CERT_LABELS[cert.level] || cert.level}
                          </div>
                          <div className="text-xs text-gray-500">N° {cert.certNumber}</div>
                          {cert.isVerified
                            ? <div className="text-xs text-green-700 flex items-center gap-1 mt-0.5">
                                <CheckCircle className="w-3 h-3" />expire le {new Date(cert.expiresAt).toLocaleDateString('fr-FR')}
                              </div>
                            : <div className="text-xs text-orange-600">En cours de vérification</div>
                          }
                        </div>
                      </div>
                      {cert.documentUrl && cert.isVerified && (
                        <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer"
                          className="btn-outline text-xs px-2 py-1.5 flex items-center gap-1">
                          <Download className="w-3 h-3" />Voir
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Types de projets */}
          {installer.projectTypes?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Types de projets</p>
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
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Avis clients ({installer.totalReviews})
              </p>
              <div className="space-y-3">
                {installer.reviews.slice(0, 3).map((r: any) => (
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
        </div>

        {/* CTA Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={goFullDevis}
              className="btn-outline flex-1 flex items-center justify-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />Devis détaillé
            </button>
            <button
              onClick={handleDevis}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              {isLoggedIn ? 'Demande rapide' : 'Se connecter pour demander'}
            </button>
          </div>
          {!isLoggedIn && (
            <p className="text-xs text-center text-gray-400 mt-2">
              Vous serez redirigé vers la connexion, puis directement vers le devis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [address,        setAddress]        = useState('');
  const [projectType,    setProjectType]    = useState('');
  const [certification,  setCertification]  = useState('');
  const [radius,         setRadius]         = useState('');
  const [results,        setResults]        = useState<any[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [searched,       setSearched]       = useState(false);
  const [errorMsg,       setErrorMsg]       = useState('');
  const [viewMode,       setViewMode]       = useState<'list' | 'map'>('list');
  const [selectedInst,   setSelectedInst]   = useState<any>(null);
  const [showFilters,    setShowFilters]    = useState(false);
  const [isLoggedIn,     setIsLoggedIn]     = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('irve_user');
    setIsLoggedIn(!!u);
  }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSelectedInst(null);
    try {
      const params: any = { address };
      if (projectType)   params.projectType   = projectType;
      if (certification) params.certification  = certification;
      if (radius)        params.radius         = radius;
      const { data } = await api.get('/installers/search', { params });
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err?.response?.data?.message || err?.message || 'Erreur réseau'}`);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Charger le profil complet de l'installateur au clic
  const handleSelectInstaller = async (inst: any) => {
    setLoadingProfile(true);
    try {
      const { data } = await installersApi.get(inst.id);
      setSelectedInst(data);
    } catch {
      setSelectedInst(inst); // Fallback sur les données partielles
    } finally {
      setLoadingProfile(false);
    }
  };

  const activeFiltersCount = [projectType, certification, radius].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav — SANS bouton connexion */}
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        {/* Pas de bouton Connexion ici */}
      </nav>

      {/* Hero search */}
      <div className="bg-gradient-to-br from-primary-light to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">Trouver un installateur IRVE</h1>
          <p className="text-gray-600 mb-6">Certifiés Qualifelec, vérifiés et près de chez vous</p>

          <form onSubmit={search} className="space-y-3">
            {/* Barre principale */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="input flex-1"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Votre adresse ou code postal (ex: Paris, 75001...)"
              />
              <button
                type="submit"
                disabled={loading || !address.trim()}
                className="btn-primary flex items-center gap-2 sm:px-6 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />{loading ? 'Recherche...' : 'Chercher'}
              </button>
            </div>

            {/* Toggle filtres */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all
                  ${showFilters || activeFiltersCount > 0
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres avancés
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Panneau filtres */}
            {showFilters && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 text-left shadow-sm space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />Affiner les résultats
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Type de projet */}
                  <div>
                    <label className="label text-xs">Type de projet</label>
                    <select
                      className="input text-sm"
                      value={projectType}
                      onChange={e => setProjectType(e.target.value)}
                    >
                      <option value="">Tous types</option>
                      {PROJECT_TYPES.map(t => (
                        <option key={t} value={t}>{PROJ_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Certification */}
                  <div>
                    <label className="label text-xs">Certification IRVE</label>
                    <select
                      className="input text-sm"
                      value={certification}
                      onChange={e => setCertification(e.target.value)}
                    >
                      <option value="">Toutes certifications</option>
                      {CERT_OPTIONS.map(c => (
                        <option key={c} value={c}>{CERT_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rayon */}
                  <div>
                    <label className="label text-xs">Rayon (km)</label>
                    <select
                      className="input text-sm"
                      value={radius}
                      onChange={e => setRadius(e.target.value)}
                    >
                      <option value="">Toute zone</option>
                      <option value="10">≤ 10 km</option>
                      <option value="25">≤ 25 km</option>
                      <option value="50">≤ 50 km</option>
                      <option value="100">≤ 100 km</option>
                    </select>
                  </div>
                </div>

                {/* Badges filtres actifs */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {projectType && (
                      <span className="badge-blue flex items-center gap-1">
                        {PROJ_LABELS[projectType]}
                        <button onClick={() => setProjectType('')}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {certification && (
                      <span className="badge-green flex items-center gap-1">
                        {CERT_SHORT[certification]}
                        <button onClick={() => setCertification('')}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {radius && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                        ≤ {radius} km
                        <button onClick={() => setRadius('')}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    <button
                      onClick={() => { setProjectType(''); setCertification(''); setRadius(''); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Tout effacer
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Résultats */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {errorMsg && (
          <div className="card border-red-200 bg-red-50 text-red-700 text-sm mb-4">{errorMsg}</div>
        )}

        {!searched && viewMode === 'list' && (
          <div className="text-center text-gray-500 py-16">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Entrez votre adresse pour trouver des installateurs certifiés</p>
            <p className="text-sm mt-1 text-gray-400">Vous pouvez aussi filtrer par certification P1 / P2 / P3 ou par zone géographique</p>
          </div>
        )}

        {!searched && viewMode === 'map' && <InstallerMap results={[]} onSelect={handleSelectInstaller} />}

        {searched && results.length === 0 && !errorMsg && (
          <div className="text-center text-gray-500 py-16">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium mb-1">Aucun installateur trouvé dans cette zone</p>
            <p className="text-sm">Essayez une zone plus large ou modifiez vos filtres.</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            {/* Barre résultats */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {results.length} installateur{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                {activeFiltersCount > 0 && <span className="text-primary ml-1">(filtres actifs)</span>}
              </p>
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />Liste
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <MapIcon className="w-4 h-4" />Carte
                </button>
              </div>
            </div>

            {viewMode === 'map' && (
              <div className="space-y-4">
                <InstallerMap results={results} onSelect={handleSelectInstaller} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map(inst => (
                    <button
                      key={inst.id}
                      onClick={() => handleSelectInstaller(inst)}
                      className="card flex items-center gap-3 hover:border-primary/30 hover:shadow-md transition-all group py-3 text-left w-full"
                    >
                      <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-primary">{inst.companyName?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-sm truncate group-hover:text-primary">{inst.companyName}</p>
                          {inst.isVerified && <Shield className="w-3 h-3 text-green-600 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500">{inst.city} · {parseFloat(inst.distance_km || 0).toFixed(1)} km</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-4">
                {results.map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => handleSelectInstaller(inst)}
                    className="card flex items-start justify-between hover:border-primary/30 hover:shadow-md transition-all group w-full text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{inst.companyName}</h3>
                        {inst.isVerified && (
                          <span className="badge-green flex items-center gap-0.5 text-xs">
                            <Shield className="w-3 h-3" />Vérifié
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />{inst.city} · à {parseFloat(inst.distance_km || 0).toFixed(1)} km
                      </div>
                      {inst.averageRating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{Number(inst.averageRating).toFixed(1)}</span>
                          <span className="text-gray-400">({inst.totalReviews} avis)</span>
                        </div>
                      )}
                      {inst.certifications?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {inst.certifications.map((c: any) => (
                            <span key={c.level} className="badge-blue">IRVE {CERT_SHORT[c.level]}</span>
                          ))}
                        </div>
                      )}
                      {inst.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{inst.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-xs text-primary font-medium hidden sm:block">Voir le profil</span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading profil overlay */}
      {loadingProfile && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-xl">
            <span className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            <span className="text-sm font-medium text-gray-700">Chargement du profil...</span>
          </div>
        </div>
      )}

      {/* Panneau profil inline */}
      {selectedInst && !loadingProfile && (
        <InstallerProfile
          installer={selectedInst}
          onClose={() => setSelectedInst(null)}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}