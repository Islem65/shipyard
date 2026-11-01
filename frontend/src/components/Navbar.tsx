import { Link } from 'react-router-dom'

const links = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#steps' },
  { label: 'Documentation', href: '#docs' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-bg">
            S
          </span>
          Shipyard
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <Link to="/login" className="rounded-lg px-4 py-2 text-muted transition-colors hover:text-ink">
            Connexion
          </Link>
          <Link
  to="/commencer"
  className="rounded-lg bg-ink px-4 py-2 font-medium text-bg transition hover:bg-white/90"
>
  Commencer
</Link>
        </div>
      </div>
    </header>
  )
}