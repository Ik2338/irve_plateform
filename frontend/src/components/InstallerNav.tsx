'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Zap, MapPin, Send, Settings, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function InstallerNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [installer, setInstaller] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('irve_user');
      if (!raw) { router.replace('/auth/login'); return; }
      const parsed = JSON.parse(raw);
      if (parsed.role !== 'INSTALLER') {
        if (parsed.role === 'ADMIN') router.replace('/admin');
        else router.replace('/dashboard');
        return;
      }
      setUser(parsed);
      const inst = localStorage.getItem('irve_installer');
      if (inst) setInstaller(JSON.parse(inst));
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
    { href: '/dashboard/installer', label: 'Leads', Icon: MapPin },
    { href: '/dashboard/installer/quotes', label: 'Mes devis', Icon: Send },
  ];

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '?';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo + badge */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/installer" className="flex items-center gap-2 font-bold text-primary">
            <Zap className="w-5 h-5" />
            <span>IRVE Platform</span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Shield className="w-3 h-3" />
            Espace Pro
          </span>
        </div>

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
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-gray-800 leading-tight">
                {installer?.companyName || user?.firstName}
              </div>
              <div className="text-xs text-gray-400 leading-tight truncate max-w-[120px]">
                {user?.email}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-30">
              <div className="px-4 py-2.5 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-800">
                  {installer?.companyName || `${user?.firstName} ${user?.lastName}`}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/installer/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Profil & certifications
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