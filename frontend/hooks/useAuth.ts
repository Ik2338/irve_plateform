'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'CLIENT' | 'INSTALLER' | 'ADMIN';

/**
 * useAuth – redirige si l'utilisateur n'est pas authentifié ou n'a pas le bon rôle.
 * Retourne l'utilisateur stocké (ou null).
 */
export function useAuth(requiredRole?: Role | Role[]) {
  const router = useRouter();

  const getUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('irve_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (requiredRole) {
      const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowed.includes(user.role)) {
        // Redirige vers le bon dashboard selon le rôle réel
        if (user.role === 'ADMIN') router.replace('/admin');
        else if (user.role === 'INSTALLER') router.replace('/dashboard/installer');
        else router.replace('/dashboard');
      }
    }
  }, []);

  return getUser();
}

/**
 * getDashboardPath – retourne le chemin du dashboard selon le rôle.
 */
export function getDashboardPath(role?: string): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'INSTALLER') return '/dashboard/installer';
  return '/dashboard';
}