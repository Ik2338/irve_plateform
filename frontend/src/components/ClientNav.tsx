'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Zap, LayoutDashboard, FileText, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ClientNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('irve_user');
      if (!raw) { router.replace('/auth/login'); return; }
      const parsed = JSON.parse(raw);
      if (parsed.role !== 'CLIENT') {
        // Redirige vers le bon espace
        if (parsed.role === 'ADMIN') router.replace('/admin');
        else if (parsed.role === 'INSTALLER') router.replace('/dashboard/installer');
        return;
      }
      setUser(parsed);
    } catch {
      router.replace('/auth/login');
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => { localStorage.clear(); router.push('/'); };

  const links = [
    { href: '/dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
    { href: '/requests/new', label: 'Nouvelle demande', Icon: FileText },
    { href: '/installers/search', label: 'Trouver un installateur', Icon: Search },
  ];

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '?';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
          <Zap className="w-5 h-5" />
          <span>IRVE Platform</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${pathname === href
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
            <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">
              {user?.firstName} {user?.lastName}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-2.5 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 text-gray-400" />
                  Mon profil
                </Link>
              </div>
              <div className="border-t border-gray-50 pt-1">
                <button
                  onClick={logout}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}