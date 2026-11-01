import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Reveal from '../components/Reveal'
import Terminal from '../components/Terminal'

const ticker = [
  'Image construite',
  'Conteneur démarré en 2 s',
  'Base PostgreSQL prête',
  'Certificat HTTPS émis',
  'Déploiement réussi',
  'Alerte envoyée sur Telegram',
]

const features = [
  { icon: '⚡', title: 'Déploiement en un clic', text: 'Collez un lien GitHub : le code est cloné, construit et lancé automatiquement.' },
  { icon: '📦', title: 'Conteneurs Docker', text: 'Chaque projet tourne dans sa boîte isolée, identique en local et en ligne.' },
  { icon: '🌐', title: 'Adresse web dédiée', text: 'Chaque site reçoit son propre sous-domaine, sans configuration réseau.' },
  { icon: '📊', title: 'Logs et métriques', text: 'Suivez l’état, la mémoire et les erreurs de vos sites en temps réel.' },
  { icon: '🔐', title: 'Secrets protégés', text: 'Vos clés d’API et mots de passe sont stockés à part, jamais dans le code.' },
  { icon: '🤖', title: 'Assistant IA', text: 'Un déploiement échoue ? L’assistant explique l’erreur et propose la correction.' },
]

const steps = [
  { n: '01', title: 'Collez votre lien', text: 'Indiquez l’adresse GitHub de votre projet.' },
  { n: '02', title: 'Shipyard construit', text: 'Le code est mis dans une boîte Docker et testé.' },
  { n: '03', title: 'Votre site est en ligne', text: 'Vous recevez une adresse web à partager.' },
]

const stats = [
  { value: '< 3 min', label: 'du code au site en ligne' },
  { value: '100 %', label: 'automatisé de bout en bout' },
  { value: '24/7', label: 'surveillance et alertes' },
  { value: '1 clic', label: 'pour redéployer' },
]

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      <Navbar />

      {/* Hero */}
      <section className="relative">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="glow pointer-events-none absolute left-1/2 top-[-120px] h-[520px] w-[820px] -translate-x-1/2" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-20 lg:grid-cols-2 lg:pt-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              Plateforme de déploiement automatique
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Du code GitHub à un <span className="text-gradient">site en ligne</span>.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Shipyard construit, déploie et surveille vos projets dans des conteneurs. Un lien suffit,
              aucun serveur à configurer.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 font-semibold text-bg shadow-lg shadow-accent/30 transition hover:brightness-110"
              >
                Déployer maintenant
              </Link>
              <a
                href="#steps"
                className="rounded-xl border border-line bg-surface px-6 py-3 font-medium transition hover:border-muted/50"
              >
                Voir comment ça marche
              </a>
            </div>
          </div>

          <div className="animate-float">
            <Terminal />
          </div>
        </div>
      </section>

      {/* Bandeau d'événements */}
      <section className="border-y border-line bg-surface/50 py-4">
        <div className="overflow-hidden">
          <div className="flex w-max animate-ticker gap-10 whitespace-nowrap font-mono text-sm text-muted">
            {[...ticker, ...ticker].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal>
          <p className="text-sm font-medium text-accent-2">Tout-en-un</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
            Tout ce qu’il faut entre le <span className="text-gradient">commit</span> et la production.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="group h-full rounded-2xl border border-line bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-surface-2">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-bg text-xl">
                  {f.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Étapes */}
      <section id="steps" className="border-y border-line bg-surface/40 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="text-sm font-medium text-accent-2">Comment ça marche</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Trois étapes, aucune configuration.</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative rounded-2xl border border-line bg-bg p-7">
                  <span className="font-mono text-sm text-accent">{s.n}</span>
                  <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-muted">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Chiffres */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="bg-surface">
              <div className="p-8">
                <p className="text-gradient text-4xl font-semibold tracking-tight">{s.value}</p>
                <p className="mt-2 text-sm text-muted">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="px-6 pb-28">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-line bg-surface p-12 text-center">
            <div className="glow pointer-events-none absolute left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 -translate-y-1/2" />
            <h2 className="relative text-4xl font-semibold tracking-tight">Prêt à mettre votre projet en ligne ?</h2>
            <p className="relative mx-auto mt-4 max-w-md text-muted">
              Créez un compte gratuit et déployez votre premier site en quelques minutes.
            </p>
            <Link
              to="/register"
              className="relative mt-8 inline-block rounded-xl bg-ink px-7 py-3 font-semibold text-bg transition hover:bg-white/90"
            >
              Commencer gratuitement
            </Link>
          </div>
        </Reveal>
      </section>

      <footer id="docs" className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted sm:flex-row">
          <span>© 2026 Shipyard. Projet d’apprentissage DevOps.</span>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-ink">Fonctionnalités</a>
            <a href="#steps" className="hover:text-ink">Étapes</a>
            <a href="https://github.com" className="hover:text-ink">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}