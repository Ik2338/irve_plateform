'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallerNav from '@/components/InstallerNav';
import {
  User, Building2, Phone, Mail, MapPin, Shield, CheckCircle,
  AlertCircle, Save, Loader2, BadgeCheck, Calendar, Hash,
  Pencil, X, ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { installersApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function InstallerProfilePage() {
  const router = useRouter();

  const [profile, setProfile]   = useState<any>(null);
  const [user, setUser]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);

  // Champs éditables
  const [form, setForm] = useState({
    companyName:    '',
    phone:          '',
    interventionRadius: 50,
    address:        '',
    city:           '',
    postalCode:     '',
    description:    '',
  });

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('irve_user');
    if (!raw) { router.push('/auth/login'); return; }
    setUser(JSON.parse(raw));

    installersApi.myProfile()
      .then((res: any) => {
        const p = res.data;
        setProfile(p);
        setForm({
          companyName:        p?.companyName        ?? '',
          phone:              p?.phone              ?? '',
          interventionRadius: p?.interventionRadius ?? 50,
          address:            p?.address            ?? '',
          city:               p?.city               ?? '',
          postalCode:         p?.postalCode         ?? '',
          description:        p?.description        ?? '',
        });
      })
      .catch(() => {
        // Pas encore de profil → on reste sur la page avec formulaire vide
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Sauvegarde ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await installersApi.updateProfile(form);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profil mis à jour !');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const qualiExpired = profile?.qualifelecExpiresAt
    && new Date(profile.qualifelecExpiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <InstallerNav />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/installer"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />Tableau de bord
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium">Mon profil</span>
        </div>

        {/* ── Alerte profil incomplet ────────────────────────────────────── */}
        {!profile && (
          <div className="card border-orange-200 bg-orange-50 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              Complétez votre profil pour apparaître dans les recherches et recevoir des leads.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            BLOC 1 — Infos du compte (lecture seule, issues du register)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />Informations du compte
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              Non modifiable ici
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={<User className="w-4 h-4 text-blue-500" />}
              label="Nom complet"
              value={user ? `${user.firstName} ${user.lastName}` : '—'}
            />
            <InfoRow
              icon={<Mail className="w-4 h-4 text-purple-500" />}
              label="Email"
              value={user?.email}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4 text-green-500" />}
              label="Téléphone (compte)"
              value={user?.phone || '—'}
            />
            <InfoRow
              icon={<Hash className="w-4 h-4 text-gray-400" />}
              label="SIRET"
              value={
                profile?.siret
                  ? profile.siret.replace(/(.{3})(.{3})(.{3})(.{5})/, '$1 $2 $3 $4')
                  : '—'
              }
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BLOC 2 — Qualification Qualifelec (lecture seule)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-primary" />Qualification Qualifelec IRVE
          </h2>

          {profile?.qualifelecCertNumber ? (
            <div className={`rounded-xl border p-4 space-y-3
              ${qualiExpired ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
            >
              <div className="flex items-center gap-2">
                {qualiExpired
                  ? <AlertCircle className="w-5 h-5 text-red-500" />
                  : <BadgeCheck className="w-5 h-5 text-green-600" />
                }
                <span className={`font-semibold text-sm ${qualiExpired ? 'text-red-700' : 'text-green-800'}`}>
                  {qualiExpired ? 'Qualification expirée' : 'Qualification valide'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={<Hash className="w-4 h-4 text-green-600" />}
                  label="N° certificat"
                  value={profile.qualifelecCertNumber}
                  small
                />
                <InfoRow
                  icon={<Calendar className="w-4 h-4 text-green-600" />}
                  label="Expire le"
                  value={
                    profile.qualifelecExpiresAt
                      ? new Date(profile.qualifelecExpiresAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })
                      : '—'
                  }
                  small
                />
              </div>

              {/* Indices IRVE */}
              {profile.qualifelecIndices?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Indices certifiés</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {profile.qualifelecIndices.map((idx: string) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold
                          ${qualiExpired
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-200 text-green-900'}`}
                      >
                        {idx}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-500">
                Aucune qualification enregistrée.
              </p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BLOC 3 — Profil installateur (éditable)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />Profil installateur
            </h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="btn-outline text-sm flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />Modifier
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />Annuler
              </button>
            )}
          </div>

          {/* ── Mode lecture ─────────────────────────────────────────────── */}
          {!editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon={<Building2 className="w-4 h-4 text-primary" />}
                label="Nom de l'entreprise"
                value={profile?.companyName || <span className="text-gray-400 italic">Non renseigné</span>}
              />
              <InfoRow
                icon={<Phone className="w-4 h-4 text-green-500" />}
                label="Téléphone pro"
                value={profile?.phone || <span className="text-gray-400 italic">Non renseigné</span>}
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4 text-red-500" />}
                label="Zone d'intervention"
                value={
                  profile?.interventionRadius
                    ? `${profile.interventionRadius} km`
                    : <span className="text-gray-400 italic">Non renseigné</span>
                }
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4 text-gray-400" />}
                label="Ville"
                value={
                  profile?.city
                    ? `${profile.city}${profile.postalCode ? ` (${profile.postalCode})` : ''}`
                    : <span className="text-gray-400 italic">Non renseignée</span>
                }
              />
              {profile?.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{profile.description}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Mode édition ─────────────────────────────────────────────── */}
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom de l'entreprise</label>
                  <input
                    className="input"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Ma Société IRVE"
                  />
                </div>
                <div>
                  <label className="label">Téléphone professionnel</label>
                  <input
                    className="input"
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="06 00 00 00 00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Adresse</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="12 rue de la République"
                  />
                </div>
                <div>
                  <label className="label">Code postal</label>
                  <input
                    className="input"
                    value={form.postalCode}
                    onChange={e => setForm({ ...form, postalCode: e.target.value })}
                    placeholder="75001"
                    maxLength={5}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ville</label>
                  <input
                    className="input"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <label className="label">
                    Rayon d'intervention : <strong>{form.interventionRadius} km</strong>
                  </label>
                  <input
                    type="range"
                    min={10} max={200} step={5}
                    value={form.interventionRadius}
                    onChange={e => setForm({ ...form, interventionRadius: +e.target.value })}
                    className="w-full mt-2 accent-primary"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>10 km</span><span>200 km</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Description / présentation</label>
                <textarea
                  className="input h-24 resize-none"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Présentez votre entreprise, vos spécialités, votre expérience..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Composant utilitaire ──────────────────────────────────────────────────────
function InfoRow({
  icon, label, value, small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className={`font-medium ${small ? 'text-sm' : 'text-sm'} text-gray-800`}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}