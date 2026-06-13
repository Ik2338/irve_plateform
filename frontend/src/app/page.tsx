import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Camera,
  ChevronDown,
  Clock,
  FileText,
  Home,
  MapPin,
  ParkingSquare,
  Plug,
  Shield,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

const projectTypes = [
  {
    title: 'Maison individuelle',
    icon: Home,
    power: '7,4 kW conseille',
    price: '800 a 1 500 EUR',
    text: 'Audit tableau, cheminement cable, protection dediee et mise en service de la wallbox.',
  },
  {
    title: 'Copropriete',
    icon: Users,
    power: '7 a 22 kW',
    price: '1 200 a 3 000 EUR / place',
    text: 'Dossier technique, droit a la prise, vote AG, supervision et comptage individuel.',
  },
  {
    title: 'Entreprise et flotte',
    icon: Building2,
    power: '22 kW et plus',
    price: 'Sur devis',
    text: 'Etude de puissance, planning chantier, bornes communicantes et pilotage energetique.',
  },
];

const process = [
  {
    title: 'Qualification du site',
    text: 'Type de parking, distance au tableau, puissance disponible, photos et contraintes d acces.',
    icon: FileText,
  },
  {
    title: 'Matching installateur',
    text: 'La demande est envoyee aux installateurs IRVE qualifies dans la bonne zone d intervention.',
    icon: MapPin,
  },
  {
    title: 'Devis et planning',
    text: 'Comparaison des offres, validation du devis, date chantier et suivi du statut en ligne.',
    icon: Clock,
  },
  {
    title: 'Installation controlee',
    text: 'Pose, protections electriques, tests de charge, mise en service et avis client verifie.',
    icon: Wrench,
  },
];

const dossierItems = [
  { label: 'Photos tableau et disjoncteur', icon: Camera },
  { label: 'Cheminement du cable', icon: ParkingSquare },
  { label: 'Puissance et connecteurs', icon: Plug },
  { label: 'Certification IRVE P1 / P2 / P3', icon: BadgeCheck },
];

const faq = [
  {
    q: 'Pourquoi passer par un installateur certifie IRVE ?',
    a: 'Au-dessus de 3,7 kW, l installation doit etre realisee par un professionnel qualifie IRVE. C est aussi indispensable pour securiser l installation et acceder aux aides disponibles.',
  },
  {
    q: 'Combien de temps prend une installation ?',
    a: 'Une maison individuelle simple se traite souvent en une demi-journee. Une copropriete ou un parking d entreprise demande une etude plus complete et un planning chantier adapte.',
  },
  {
    q: 'Quel type de borne choisir ?',
    a: 'Pour la plupart des particuliers, une wallbox 7,4 kW suffit. Les parkings collectifs et flottes utilisent souvent du 11, 22 kW ou plus selon la puissance disponible et les usages.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17201c]">
      <nav className="sticky top-0 z-30 border-b border-white/20 bg-[#17201c] text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <Zap className="h-5 w-5" />
            </span>
            <span>IRVE Platform</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-white/75 md:flex">
            <a href="#projets" className="hover:text-white">Projets</a>
            <a href="#methode" className="hover:text-white">Methode</a>
            <a href="#dossier" className="hover:text-white">Dossier technique</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 sm:inline-flex">
              Connexion
            </Link>
            <Link href="/requests/new" className="btn-primary text-sm">
              Demarrer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1800&q=85"
          alt="Borne de recharge electrique installee sur un site client"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17201c] via-black/60 to-transparent" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              <Shield className="h-4 w-4 text-accent" />
              Reseau d installateurs IRVE qualifies
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
              Installation de bornes IRVE
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              Une plateforme faite pour de vrais projets terrain: audit technique, devis qualifies,
              suivi chantier et mise en service par des professionnels certifies.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/requests/new" className="btn-primary px-6 py-3 text-base">
                Deposer une demande
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/auth/register?role=INSTALLER" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20">
                <Wrench className="h-5 w-5" />
                Espace installateur
              </Link>
            </div>
          </div>

          <div className="mt-12 grid max-w-4xl gap-3 sm:grid-cols-3">
            {[
              ['48 h', 'pour recevoir les premiers retours'],
              ['P1 / P2 / P3', 'qualifications IRVE suivies'],
              ['Maison, copro, flotte', 'parcours adaptes au site'],
            ].map(([value, label]) => (
              <div key={value} className="rounded-lg border border-white/20 bg-white/10 p-4 text-white backdrop-blur">
                <div className="text-2xl font-black">{value}</div>
                <div className="mt-1 text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projets" className="px-4 py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Types de projets</p>
              <h2 className="mt-2 text-3xl font-black">Une interface pensee pour l installation, pas seulement la demande.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#627269]">
              Le style met maintenant en avant les vraies decisions de chantier:
              puissance, acces parking, protection electrique, photos et certification.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {projectTypes.map(({ title, icon: Icon, power, price, text }) => (
              <article key={title} className="card">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent-dark">{power}</span>
                </div>
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#627269]">{text}</p>
                <div className="mt-5 border-t border-[#d8e2dc] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#627269]">Budget indicatif</p>
                  <p className="mt-1 text-xl font-black text-primary">{price}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="methode" className="bg-white px-4 py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Methode</p>
            <h2 className="mt-2 text-3xl font-black">Du premier diagnostic a la mise en service.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {process.map(({ title, text, icon: Icon }, index) => (
              <article key={title} className="rounded-lg border border-[#d8e2dc] bg-[#f8faf6] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-black text-accent">0{index + 1}</span>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#627269]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="dossier" className="px-4 py-16 scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Dossier technique</p>
            <h2 className="mt-2 text-3xl font-black">Les installateurs recoivent un dossier exploitable.</h2>
            <p className="mt-4 text-sm leading-7 text-[#627269]">
              La demande n est pas un simple formulaire de contact. Elle collecte les elements utiles
              pour estimer correctement le chantier et reduire les allers-retours avant devis.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dossierItems.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-[#d8e2dc] bg-white p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d8e2dc] bg-[#17201c] p-5 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Exemple dossier</p>
                <h3 className="mt-1 text-xl font-black">Parking copropriete</h3>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold">IRVE P2</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['Puissance cible', '22 kW triphase'],
                ['Emplacements', '12 places en sous-sol'],
                ['Distance tableau', '34 m avec 2 percements'],
                ['Connecteur', 'Type 2 AC'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 rounded-lg bg-white/10 px-4 py-3">
                  <span className="text-sm text-white/60">{label}</span>
                  <span className="text-right text-sm font-bold">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm leading-6 text-white/80">
                Les conditions d aides et de conformite peuvent evoluer. Le dossier aide l installateur
                a valider les points critiques avant engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#17201c] px-4 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Pret pour le chantier ?</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-black">Deposez un projet clair et recevez des devis comparables.</h2>
          </div>
          <Link href="/requests/new" className="btn-primary w-full px-6 py-3 md:w-auto">
            Creer ma demande
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section id="faq" className="px-4 py-16 scroll-mt-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-black">Questions frequentes</h2>
          <div className="mt-6 space-y-3">
            {faq.map(({ q, a }) => (
              <details key={q} className="group rounded-lg border border-[#d8e2dc] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold">
                  {q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="border-t border-[#d8e2dc] px-5 pb-5 pt-4 text-sm leading-6 text-[#627269]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d8e2dc] px-4 py-8 text-center text-sm text-[#627269]">
        IRVE Platform - Mise en relation pour installations de bornes de recharge.
      </footer>
    </main>
  );
}
