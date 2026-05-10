import Link from 'next/link';
import { Zap, Search, Shield, FileText, ArrowRight, CheckCircle, Clock, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Zap className="w-6 h-6" />
            IRVE Platform
          </div>
          <div className="flex items-center gap-4">
            <Link href="/installers/search" className="text-gray-600 hover:text-primary text-sm">Trouver un installateur</Link>
            <Link href="/auth/login" className="text-gray-600 hover:text-primary text-sm">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-sm">Déposer une demande</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-light to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-primary/20 text-primary text-sm px-4 py-1.5 rounded-full mb-6">
            <Shield className="w-4 h-4" />
            Installateurs certifiés IRVE P1/P2/P3
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
            <Link href="/installers/search" className="btn-outline text-lg px-8 py-3 flex items-center gap-2 justify-center">
              <Search className="w-5 h-5" /> Rechercher un installateur
            </Link>
          </div>
        </div>
      </section>


      {/* Avantages */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Certifiés Qualifelec', desc: 'Tous nos installateurs sont qualifiés et vérifiés.' },
            { icon: Clock, title: 'Sous 48 heures', desc: 'Recevez vos premiers devis rapidement.' },
            { icon: Star, title: 'Avis vérifiés', desc: 'Consultez les retours d\'expérience de nos clients.' },
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

      {/* Steps */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: FileText, step: '1', title: 'Déposez votre demande', desc: 'Décrivez votre projet : type d\'installation, puissance souhaitée, adresse.' },
            { icon: Search, step: '2', title: 'Recevez des devis', desc: 'Nos installateurs certifiés dans votre zone vous contactent sous 48h.' },
            { icon: CheckCircle, step: '3', title: 'Choisissez et installez', desc: 'Comparez les offres, acceptez le meilleur devis et planifiez l\'installation.' },
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
      {/* Qui sommes-nous */}
      <section className="bg-gray-50 py-16 px-4">
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