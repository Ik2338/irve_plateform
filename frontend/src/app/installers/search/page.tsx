'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Zap, Search, MapPin, Star, Shield, ChevronRight, List, Map as MapIcon } from 'lucide-react';
import { api } from '@/lib/api';

const PROJECT_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'COPROPRIETE'];
const LABELS: any = { RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise', COPROPRIETE: 'Copropriété' };
const CERTS: any  = { IRVE_P1: 'P1', IRVE_P2: 'P2', IRVE_P3: 'P3' };

// ─────────────────────────────────────────────────────────────────────────────
// Composant carte (Leaflet chargé dynamiquement)
// ─────────────────────────────────────────────────────────────────────────────
function InstallerMap({ results }: { results: any[] }) {
  const mapRef   = useRef<any>(null);
  const mapElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapElRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
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
        ? [results[0].lat, results[0].lng]
        : [48.8566, 2.3522];

      const map = L.map(mapElRef.current).setView(center, 10);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#16a34a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:rotate(-45deg);"></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      results.forEach(inst => {
        const lat = inst.lat ?? inst.latitude  ?? null;
        const lng = inst.lng ?? inst.longitude ?? null;
        if (!lat || !lng) return;
        const popup = `
          <div style="min-width:180px;font-family:system-ui">
            <p style="font-weight:700;margin:0 0 4px">${inst.companyName}</p>
            ${inst.isVerified ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:99px;font-size:11px">✓ Vérifié IRVE</span>' : ''}
            <p style="color:#6b7280;font-size:12px;margin:6px 0">${inst.city} · ${parseFloat(inst.distance_km || 0).toFixed(1)} km</p>
            <a href="/installers/${inst.id}" style="color:#16a34a;font-size:12px;font-weight:600">Voir le profil →</a>
          </div>`;
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
      });

      if (results.length > 1) {
        const validCoords = results.filter(r => (r.lat || r.latitude) && (r.lng || r.longitude));
        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords.map((r: any) => [r.lat ?? r.latitude, r.lng ?? r.longitude]));
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

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [address,     setAddress]     = useState('');
  const [projectType, setProjectType] = useState('');
  const [results,     setResults]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [viewMode,    setViewMode]    = useState<'list' | 'map'>('list');

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // ✅ Utilise l'instance axios (passe par nginx /api/) — plus de localhost hardcodé
      const params: any = { address };
      if (projectType) params.projectType = projectType;
      const { data } = await api.get('/installers/search', { params });
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur réseau';
      setErrorMsg(`Erreur : ${msg}`);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        <Link href="/auth/login" className="text-sm text-gray-600 hover:text-primary">Connexion</Link>
      </nav>

      <div className="bg-gradient-to-br from-primary-light to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">Trouver un installateur IRVE</h1>
          <p className="text-gray-600 mb-6">Certifiés Qualifelec, vérifiés et près de chez vous</p>
          <form onSubmit={search} className="flex flex-col sm:flex-row gap-3">
            <input className="input flex-1" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Votre adresse ou code postal (ex: Paris, 75001...)" />
            <select className="input sm:w-44" value={projectType} onChange={e => setProjectType(e.target.value)}>
              <option value="">Tous types</option>
              {PROJECT_TYPES.map(t => <option key={t} value={t}>{LABELS[t]}</option>)}
            </select>
            <button type="submit" disabled={loading || !address.trim()}
              className="btn-primary flex items-center gap-2 sm:px-6 disabled:opacity-50">
              <Search className="w-4 h-4" />{loading ? 'Recherche...' : 'Chercher'}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {errorMsg && <div className="card border-red-200 bg-red-50 text-red-700 text-sm mb-4">{errorMsg}</div>}

        {!searched && !errorMsg && viewMode === 'list' && (
          <div className="text-center text-gray-500 py-16">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Entrez votre adresse pour trouver des installateurs certifiés</p>
          </div>
        )}

        {!searched && viewMode === 'map' && <InstallerMap results={[]} />}

        {searched && results.length === 0 && !errorMsg && (
          <div className="text-center text-gray-500 py-16">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium mb-1">Aucun installateur trouvé dans cette zone</p>
            <p className="text-sm">Essayez une zone plus large ou{' '}
              <Link href="/requests/new" className="text-primary">déposez une demande</Link>.</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {results.length} installateur{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <List className="w-4 h-4" />Liste
                </button>
                <button onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <MapIcon className="w-4 h-4" />Carte
                </button>
              </div>
            </div>

            {viewMode === 'map' && (
              <div className="space-y-4">
                <InstallerMap results={results} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map(inst => (
                    <Link key={inst.id} href={`/installers/${inst.id}`}
                      className="card flex items-center gap-3 hover:border-primary/30 hover:shadow-md transition-all group py-3">
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
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-4">
                {results.map(inst => (
                  <Link key={inst.id} href={`/installers/${inst.id}`}
                    className="card flex items-start justify-between hover:border-primary/30 hover:shadow-md transition-all group">
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
                            <span key={c.level} className="badge-blue">IRVE {CERTS[c.level]}</span>
                          ))}
                        </div>
                      )}
                      {inst.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{inst.description}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary mt-1 flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}