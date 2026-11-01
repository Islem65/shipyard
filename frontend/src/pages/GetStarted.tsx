import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Reveal from '../components/Reveal'

const perks = [
  { icon: '⚡', text: 'Premier déploiement en moins de 3 minutes' },
  { icon: '📦', text: 'Chaque projet dans son propre conteneur' },
  { icon: '🔐', text: 'Un espace personnel et sécurisé' },
]

export default function GetStarted() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-bg">
      <Navbar />

      <main className="relative flex flex-1 items-center justify-center px-6 py-20">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="glow pointer-events-none absolute left-1/2 top-[-60px] h-[520px] w-[820px] animate-aurora" />
        <div className="glow pointer-events-none absolute left-1/2 top-[160px] h-[420px] w-[620px] animate-aurora-slow opacity-60" />

        <Reveal className="relative w-full max-w-lg">
          <div className="border-spin rounded-3xl p-10 text-center shadow-2xl shadow-accent/10">
            <div className="mx-auto grid h-16 w-16 animate-float place-items-center rounded-2xl border border-line bg-bg text-3xl">
              🔒
            </div>

            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Compte requis
            </span>

            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
              Inscrivez-vous pour <span className="text-gradient">commencer</span>
            </h1>
            <p className="mx-auto mt-4 max-w-sm leading-relaxed text-muted">
              Pour déployer votre premier projet, vous avez besoin d’un compte Shipyard. C’est gratuit et cela
              prend moins d’une minute.
            </p>

            <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm">
              {perks.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-muted">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-bg">
                    {p.icon}
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>

            <Link
              to="/Signup"
              className="btn-shimmer mt-9 block rounded-xl px-6 py-3.5 font-semibold text-bg shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              S’inscrire
            </Link>

            <p className="mt-5 text-sm text-muted">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-ink underline-offset-4 hover:underline">
                Connexion
              </Link>
            </p>
          </div>
        </Reveal>
      </main>
    </div>
  )
}