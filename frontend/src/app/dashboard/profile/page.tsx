'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, User, Mail, Phone, Lock, Save, ArrowLeft, CheckCircle, Eye, EyeOff, Pencil } from 'lucide-react';
import { api, authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function UserProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSection, setPasswordSection] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('irve_user');
    if (!stored) { router.push('/auth/login'); return; }
    const parsed = JSON.parse(stored);
    setUser(parsed);
    setForm({ firstName: parsed.firstName, lastName: parsed.lastName, phone: parsed.phone || '' });
    // Fetch fresh data from API
    authApi.me().then(({ data }) => {
      setUser(data);
      setForm({ firstName: data.firstName, lastName: data.lastName, phone: data.phone || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', form);
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('irve_user', JSON.stringify(updated));
      toast.success('Profil mis à jour !');
      setEditMode(false);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Mot de passe modifié !');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSection(false);
    } catch {
      toast.error('Mot de passe actuel incorrect');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />IRVE Platform
        </Link>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
          <ArrowLeft className="w-4 h-4" />Tableau de bord
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              Client
            </span>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${editMode ? 'bg-gray-100 text-gray-600' : 'bg-primary-light text-primary hover:bg-primary/20'}`}
          >
            <Pencil className="w-3.5 h-3.5" />
            {editMode ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-gray-900">Informations personnelles</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom</label>
                {editMode
                  ? <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  : <p className="mt-1 text-gray-800 font-medium">{user?.firstName}</p>
                }
              </div>
              <div>
                <label className="label">Nom</label>
                {editMode
                  ? <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  : <p className="mt-1 text-gray-800 font-medium">{user?.lastName}</p>
                }
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</label>
              <p className="mt-1 text-gray-800 font-medium">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">L'email ne peut pas être modifié</p>
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Téléphone</label>
              {editMode
                ? <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 00 00 00 00" />
                : <p className="mt-1 text-gray-800 font-medium">{user?.phone || <span className="text-gray-400 italic">Non renseigné</span>}</p>
              }
            </div>

            {editMode && (
              <button onClick={saveProfile} disabled={saving}
                className="btn-primary flex items-center gap-2 mt-2">
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            )}
          </div>
        </div>

        {/* Mot de passe */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-gray-900">Mot de passe</h2>
            </div>
            <button
              onClick={() => setPasswordSection(!passwordSection)}
              className="text-sm text-primary hover:underline"
            >
              {passwordSection ? 'Annuler' : 'Changer'}
            </button>
          </div>

          {!passwordSection && (
            <p className="text-sm text-gray-500">••••••••••••</p>
          )}

          {passwordSection && (
            <div className="space-y-3 mt-4">
              <div>
                <label className="label">Mot de passe actuel</label>
                <div className="relative">
                  <input className="input pr-10" type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Nouveau mot de passe</label>
                <input className="input" type="password" minLength={8}
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </div>
              <div>
                <label className="label">Confirmer le mot de passe</label>
                <input className="input" type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
                {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Correspondance confirmée</p>
                )}
              </div>
              <button onClick={changePassword} disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                className="btn-primary flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {saving ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          )}
        </div>

        {/* Infos compte */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Informations du compte</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Membre depuis</span>
              <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rôle</span>
              <span className="font-medium">Client</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}