import Link from 'next/link';
import { Zap, Search, Shield, FileText, ArrowRight, CheckCircle, Clock, Star, AlertCircle, Info, ChevronDown } from 'lucide-react';

/* ── DONNÉES ── */

const chargerTypes = [
  {
    id: 'prise',
    label: 'Prise renforcée 3,2 kW',
    power: '3,2 kW',
    time: '12–20 h',
    connector: 'Type E (domestique)',
    profile: 'Dépannage ponctuel',
    badge: 'bg-amber-100 text-amber-800',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    desc: 'Une prise 16A renforcée. Solution économique mais lente. À réserver aux petits rouleurs ou en solution provisoire.',
  },
  {
    id: 'ac7',
    label: 'Wallbox 7,4 kW',
    power: '7,4 kW',
    time: '5–8 h',
    connector: 'Type 2 (Mennekes)',
    profile: 'Particulier / maison',
    badge: 'bg-green-100 text-green-800',
    img: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&q=80',
    desc: 'Le choix idéal pour la majorité des particuliers. Recharge complète en une nuit sans effort.',
    popular: true,
  },
  {
    id: 'ac22',
    label: 'Borne triphasée 22 kW',
    power: '22 kW',
    time: '1–4 h',
    connector: 'Type 2 (Mennekes)',
    profile: 'Copropriété / entreprise',
    badge: 'bg-blue-100 text-blue-800',
    img: 'https://images.unsplash.com/photo-1571168244480-5e27d6e3df7e?w=600&q=80',
    desc: 'Recharge rapide en triphasé. Idéale pour les parkings collectifs, les flottes et les professionnels.',
  },
  {
    id: 'dc',
    label: 'Charge rapide DC 50–350 kW',
    power: '50–350 kW',
    time: '15–45 min',
    connector: 'CCS / CHAdeMO',
    profile: 'Station publique',
    badge: 'bg-purple-100 text-purple-800',
    img: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=600&q=80',
    desc: 'Charge ultra-rapide sur autoroute ou station publique. Non installable à domicile.',
  },
];

const connectors = [
  {
    name: 'Type 2 (Mennekes)',
    usage: 'Standard AC — obligatoire en France',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    tag: 'Norme EU',
    tagColor: 'bg-green-100 text-green-800',
  },
  {
    name: 'CCS Combo 2',
    usage: 'Charge rapide DC — standard européen',
    img: 'https://images.unsplash.com/photo-1571168244480-5e27d6e3df7e?w=400&q=80',
    tag: 'Rapide DC',
    tagColor: 'bg-blue-100 text-blue-800',
  },
  {
    name: 'CHAdeMO',
    usage: 'DC — Nissan Leaf, Mitsubishi',
    img: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=400&q=80',
    tag: 'DC Asie',
    tagColor: 'bg-amber-100 text-amber-800',
  },
  {
    name: 'Tesla NACS',
    usage: 'Superchargeurs Tesla',
    img: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80',
    tag: 'Tesla',
    tagColor: 'bg-red-100 text-red-800',
  },
];

const profiles = [
  {
    title: 'Particulier — maison',
    power: '7,4 kW recommandé',
    price: '800 – 1 500 €',
    img: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80',
    steps: [
      'Tableau électrique 32A recommandé',
      'Disjoncteur dédié + différentiel type A',
      'Wallbox certifiée (Wallbox Pulsar, Schneider EVlink…)',
      'Aide ADVENIR jusqu\'à 500 €',
    ],
  },
  {
    title: 'Copropriété / parking',
    power: '7 – 22 kW',
    price: '1 200 – 3 000 € / place',
    img: 'https://images.unsplash.com/photo-1571168244480-5e27d6e3df7e?w=800&q=80',
    steps: [
      'Vote en AG (majorité article 25)',
      'Colonne montante dédiée ou réseau BT',
      'Supervision et facturation individuelle (OCPP)',
      'Aide ADVENIR T2 jusqu\'à 50 %',
    ],
  },
  {
    title: 'Entreprise / flotte',
    power: '22 kW',
    price: 'Sur devis',
    img: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800&q=80',
    steps: [
      'Audit du site et étude de puissance',
      'Gestion d\'énergie avec GTB/GTC',
      'Bornes compatibles OCPP 1.6/2.0',
      'Crédit d\'impôt + aide ADEME disponibles',
    ],
  },
];

const faq = [
  {
    q: 'Ai-je besoin d\'un électricien certifié IRVE ?',
    a: 'Oui, depuis le 1er juillet 2023, toute installation de borne > 3,7 kW doit être réalisée par un électricien certifié IRVE (P1, P2 ou P3). Cette certification est délivrée par Qualifelec. Elle conditionne aussi l\'accès aux aides financières.',
  },
  {
    q: 'Quelle puissance choisir pour mon véhicule ?',
    a: 'Vérifiez le chargeur embarqué (OBC) de votre voiture. Une Renault Zoé accepte jusqu\'à 22 kW AC, une Peugeot e-208 jusqu\'à 11 kW. Inutile d\'installer une borne plus puissante. Pour 90 % des particuliers, 7,4 kW est amplement suffisant.',
  },
  {
    q: 'Quelles aides financières sont disponibles ?',
    a: 'L\'aide ADVENIR couvre jusqu\'à 50 % en copropriété. Le crédit d\'impôt pour les bornes à domicile s\'élève à 75 % plafonné à 300 €. Certaines régions proposent des compléments. Votre installateur vous aide à monter le dossier.',
  },
  {
    q: 'Combien de temps dure l\'installation ?',
    a: 'Une installation domestique standard prend entre 4 et 8 heures. En copropriété ou entreprise, il faut compter plusieurs jours selon la complexité du réseau. Le délai de réception des devis sur notre plateforme est de 48 h.',
  },
  {
    q: 'Quelle différence entre IRVE P1, P2 et P3 ?',
    a: 'P1 : installation individuelle ≤ 3,7 kW. P2 : individuelle ou collective ≤ 22 kW (le plus courant pour les wallbox). P3 : installations > 22 kW, charge rapide DC et supervision avancée.',
  },
];

/* ── PAGE ── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Zap className="w-6 h-6" />
            IRVE Platform
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#bornes" className="text-gray-600 hover:text-primary">Types de bornes</a>
            <a href="#connecteurs" className="text-gray-600 hover:text-primary">Connecteurs</a>
            <a href="#profils" className="text-gray-600 hover:text-primary">Votre profil</a>
            <a href="#faq" className="text-gray-600 hover:text-primary">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-primary text-sm">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-sm">Déposer une demande</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-primary-light to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-primary/20 text-primary text-sm px-4 py-1.5 rounded-full mb-6">
            <Shield className="w-4 h-4" />
            Installateurs certifiés IRVE P1 / P2 / P3
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Installez votre borne de recharge<br />
            <span className="text-primary">avec un pro certifié</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Particulier, entreprise ou copropriété — déposez votre demande et recevez des devis d'installateurs IRVE qualifiés près de chez vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/requests/new" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 justify-center">
              Déposer une demande <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#bornes" className="btn-outline text-lg px-8 py-3 flex items-center gap-2 justify-center">
              <Search className="w-5 h-5" /> Je veux tout savoir d'abord
            </a>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Certifiés Qualifelec', desc: 'Tous nos installateurs sont qualifiés et vérifiés avant d\'être référencés.' },
            { icon: Clock, title: 'Devis sous 48 heures', desc: 'Recevez vos premiers devis rapidement, directement depuis la plateforme.' },
            { icon: Star, title: 'Avis vérifiés', desc: 'Consultez les retours d\'expérience authentifiés de nos clients.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                   style={{ background: 'var(--color-primary-light)' }}>
                <Icon className="w-7 h-7 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">{title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION : TYPES DE BORNES ── */}
      <section id="bornes" className="py-20 px-4 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Quels types de bornes existent ?</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              La puissance détermine la vitesse de recharge. Choisissez selon votre véhicule et vos habitudes quotidiennes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {chargerTypes.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col relative">
                {c.popular && (
                  <div className="absolute top-3 right-3 z-10 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ Recommandé
                  </div>
                )}
                <div className="h-44 overflow-hidden">
                  <img
                    src={c.img}
                    alt={c.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full self-start ${c.badge}`}>{c.profile}</span>
                  <h3 className="font-bold text-gray-900">{c.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{c.desc}</p>
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs">Puissance</div>
                      <div className="font-bold text-gray-800">{c.power}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Temps recharge</div>
                      <div className="font-bold text-gray-800">{c.time}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-400 text-xs">Connecteur</div>
                      <div className="font-semibold text-gray-700">{c.connector}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Barre de comparaison */}
          <div className="mt-10 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-5">Comparaison vitesse de recharge (km de range ajoutés / heure)</div>
            <div className="space-y-4">
              {[
                { label: 'Prise 3,2 kW', pct: 5, km: '~15 km/h', color: 'bg-amber-400' },
                { label: 'Wallbox 7,4 kW', pct: 20, km: '~50 km/h', color: 'bg-[var(--color-primary)]' },
                { label: 'Triphasé 22 kW', pct: 60, km: '~140 km/h', color: 'bg-blue-500' },
                { label: 'DC Rapide 350 kW', pct: 100, km: '> 1 000 km/h', color: 'bg-purple-500' },
              ].map(({ label, pct, km, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-36 text-sm text-gray-700 shrink-0">{label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-28 text-sm text-gray-500 text-right">{km}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION : CONNECTEURS ── */}
      <section id="connecteurs" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Les types de connecteurs</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Le bon câble dépend à la fois de votre véhicule et de la borne. Voici les standards que vous rencontrerez.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {connectors.map((conn) => (
              <div key={conn.name} className="card overflow-hidden p-0 flex flex-col">
                <div className="h-40 overflow-hidden">
                  <img src={conn.img} alt={conn.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full self-start ${conn.tagColor}`}>{conn.tag}</span>
                  <div className="font-bold text-gray-900 text-sm">{conn.name}</div>
                  <div className="text-xs text-gray-500">{conn.usage}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>En France, le Type 2 (Mennekes) est la norme obligatoire</strong> pour toutes les nouvelles bornes publiques AC. Le CCS Combo 2 est le standard pour la charge rapide DC. Vérifiez le port de votre véhicule avant de choisir votre installation.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION : PROFILS ── */}
      <section id="profils" className="py-20 px-4 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Quel est votre profil ?</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Démarches, coûts et puissances varient selon votre type d'installation. Voici ce qu'il faut savoir.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {profiles.map(({ title, power, price, img, steps }) => (
              <div key={title} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img src={img} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="font-bold text-lg">{title}</div>
                    <div className="text-white/80 text-sm">{power}</div>
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Coût estimé installation</div>
                    <div className="text-2xl font-extrabold text-gray-900">{price}</div>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {steps.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <Link href="/requests/new" className="btn-primary text-sm text-center mt-2">
                    Obtenir des devis →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION : AIDES FINANCIÈRES ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Aides & subventions disponibles</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Cumulez les aides pour réduire significativement votre reste à charge.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'ADVENIR',
                amount: 'Jusqu\'à 50 %',
                who: 'Copropriétés · Entreprises',
                detail: 'Programme piloté par l\'AVERE. Couvre les bornes en parking collectif et les flottes d\'entreprise.',
                color: 'border-primary/30 bg-primary-light',
              },
              {
                name: 'Crédit d\'impôt',
                amount: '75 % (max 300 €)',
                who: 'Particuliers — résidence principale',
                detail: 'Pour l\'achat et la pose d\'une borne à domicile. S\'applique en résidence principale sous conditions.',
                color: 'border-green-200 bg-green-50',
              },
              {
                name: 'Aides régionales',
                amount: 'Variable',
                who: 'Selon région / département',
                detail: 'Certaines collectivités (Île-de-France, Grand Est…) proposent des compléments de subvention.',
                color: 'border-purple-200 bg-purple-50',
              },
            ].map(({ name, amount, who, detail, color }) => (
              <div key={name} className={`rounded-2xl border-2 p-6 ${color} flex flex-col gap-3`}>
                <div className="text-3xl font-extrabold text-primary">{amount}</div>
                <div className="font-bold text-gray-900 text-lg">{name}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{who}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Les conditions d'éligibilité changent régulièrement. Votre installateur certifié IRVE vous guidera dans le montage du dossier d'aide.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION : CERTIFICATION IRVE ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi la certification IRVE est obligatoire</h2>
            <p className="text-gray-600 mb-6">
              Depuis le 1ᵉʳ juillet 2023, la loi impose que tout électricien qui installe une borne <sup>&lt; 3,7 kW</sup> soit certifié IRVE. Cette obligation garantit la sécurité de l'installation et conditionne l'accès aux aides financières.
            </p>
            <div className="space-y-3">
              {[
                { level: 'P1', desc: 'Installation individuelle ≤ 3,7 kW (prise renforcée)' },
                { level: 'P2', desc: 'Installation individuelle ou collective ≤ 22 kW — le plus courant' },
                { level: 'P3', desc: 'Installations > 22 kW, charge rapide DC, supervision avancée' },
              ].map(({ level, desc }) => (
                <div key={level} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
                  <div className="bg-primary text-white font-bold text-sm w-10 h-10 rounded-lg flex items-center justify-center shrink-0">{level}</div>
                  <p className="text-sm text-gray-700 mt-1.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden h-96 relative">
            <img
              src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80"
              alt="Électricien certifié IRVE installant une borne"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <div className="font-bold text-lg">Installation vérifiée & garantie</div>
              <div className="text-white/80 text-sm mt-1">Assurance décennale · NF C 15-100 · Avis clients authentifiés</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION : COMMENT ÇA MARCHE ── */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: FileText, step: '1', title: 'Déposez votre demande', desc: 'Décrivez votre projet : type d\'installation, puissance souhaitée, adresse. 5 minutes suffisent.' },
            { icon: Search, step: '2', title: 'Recevez des devis', desc: 'Des installateurs certifiés dans votre zone vous contactent sous 48 h avec des offres détaillées.' },
            { icon: CheckCircle, step: '3', title: 'Choisissez et installez', desc: 'Comparez les offres, acceptez le meilleur devis et planifiez l\'installation sereinement.' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="card text-center">
              <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-4xl font-black text-primary/20 mb-2">{step}</div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION : FAQ ── */}
      <section id="faq" className="bg-gray-50 py-20 px-4 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-3">
            {faq.map(({ q, a }) => (
              <details key={q} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-gray-900 hover:bg-gray-50 list-none">
                  {q}
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA INSTALLATEUR ── */}
      <section className="bg-gray-50 py-16 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Vous êtes installateur IRVE ?</h2>
          <p className="text-gray-600 mb-6">Référencez-vous sur notre plateforme et accédez à des leads qualifiés dans votre zone d'intervention.</p>
          <Link href="/auth/register?role=INSTALLER" className="btn-primary inline-flex items-center gap-2">
            Créer mon espace pro <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 px-4 text-center text-sm text-gray-500">
        © 2024 IRVE Platform – Mise en relation installateurs IRVE certifiés
      </footer>
    </div>
  );
}