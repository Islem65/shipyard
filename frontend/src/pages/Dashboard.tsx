import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe, getToken, logout, type User } from '../services/api'

/* ------------------------------------------------------------------ */
/*  Données de démonstration (les vrais déploiements viendront plus tard) */
/* ------------------------------------------------------------------ */

type Status = 'online' | 'building' | 'failed'
type Filter = 'all' | Status

type Project = {
  name: string
  repo: string
  stack: string
  url: string
  status: Status
  when: string
}

const projects: Project[] = [
  { name: 'site-html', repo: 'demo/site-html', stack: 'HTML statique', url: 'site-html.shipyard.app', status: 'online', when: 'il y a 2 h' },
  { name: 'api-python', repo: 'demo/api-python', stack: 'Python · FastAPI', url: 'api-python.shipyard.app', status: 'building', when: 'en cours' },
  { name: 'app-node', repo: 'demo/app-node', stack: 'Node.js', url: 'app-node.shipyard.app', status: 'failed', when: 'hier' },
]

const statusInfo: Record<Status, { label: string; dot: string; pill: string }> = {
  online: { label: 'En ligne', dot: 'bg-ok', pill: 'border-ok/30 bg-ok/10 text-ok' },
  building: { label: 'Build en cours', dot: 'bg-amber-400 animate-pulse', pill: 'border-amber-400/30 bg-amber-400/10 text-amber-300' },
  failed: { label: 'Échec', dot: 'bg-red-400', pill: 'border-red-400/30 bg-red-400/10 text-red-300' },
}

const dayLabels = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
const deploysPerDay = [2, 4, 3, 6, 5, 9, 7]

const logLines: { time: string; tag: string; text: string; tone: 'muted' | 'accent' | 'ok' }[] = [
  { time: '14:02:11', tag: 'git', text: 'Clonage de github.com/demo/api-python', tone: 'muted' },
  { time: '14:02:13', tag: 'git', text: 'Dernier commit : a3f9c21 « ajout route /health »', tone: 'muted' },
  { time: '14:02:14', tag: 'build', text: 'Détection du projet : Python 3.12', tone: 'accent' },
  { time: '14:02:16', tag: 'build', text: 'Étape 1/4  FROM python:3.12-slim', tone: 'muted' },
  { time: '14:02:21', tag: 'build', text: 'Étape 2/4  pip install -r requirements.txt', tone: 'muted' },
  { time: '14:02:49', tag: 'build', text: 'Étape 3/4  COPY app ./app', tone: 'muted' },
  { time: '14:02:50', tag: 'scan', text: 'Analyse de sécurité de l’image : aucune faille critique', tone: 'ok' },
  { time: '14:02:55', tag: 'k8s', text: 'Démarrage de 2 réplicas', tone: 'accent' },
  { time: '14:03:02', tag: 'k8s', text: 'Contrôle de santé réussi', tone: 'ok' },
  { time: '14:03:03', tag: 'url', text: 'Publié sur https://api-python.shipyard.app', tone: 'ok' },
]

const toneClass = { muted: 'text-muted', accent: 'text-accent-2', ok: 'text-ok' }

/* ------------------------------------------------------------------ */
/*  Icônes                                                              */
/* ------------------------------------------------------------------ */

const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  cube: 'M21 8l-9-5-9 5v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  sliders: 'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M20 18h0 M14 4v4 M8 10v4 M16 16v4',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.3-4.3',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  x: 'M6 6l12 12 M18 6L6 18',
  plus: 'M12 5v14 M5 12h14',
}

function Icon({ name, className = 'h-[18px] w-[18px]' }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Petits graphiques                                                   */
/* ------------------------------------------------------------------ */

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 84
  const h = 28
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-[84px]" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ActivityChart() {
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? deploysPerDay.length - 1
  const W = 600
  const H = 190
  const padX = 20
  const padTop = 16
  const padBottom = 10
  const max = 10
  const step = (W - padX * 2) / (deploysPerDay.length - 1)
  const x = (i: number) => padX + i * step
  const y = (v: number) => H - padBottom - (v / max) * (H - padTop - padBottom)
  const line = deploysPerDay.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  const area = `${line} L${x(deploysPerDay.length - 1)},${H - padBottom} L${x(0)},${H - padBottom} Z`
  const total = deploysPerDay.reduce((a, b) => a + b, 0)

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 lg:col-span-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Déploiements des 7 derniers jours</h2>
          <p className="mt-1 text-sm text-muted">{total} au total cette semaine</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tabular-nums leading-none">{deploysPerDay[active]}</p>
          <p className="mt-1 text-sm text-muted">{dayNames[active]}</p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 h-auto w-full"
        role="img"
        aria-label={`Déploiements par jour : ${deploysPerDay.map((v, i) => `${dayNames[i]} ${v}`).join(', ')}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 5, 10].map((g) => (
          <g key={g}>
            <line x1={padX} x2={W - padX} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeDasharray={g === 0 ? undefined : '3 5'} />
          </g>
        ))}
        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <line x1={x(active)} x2={x(active)} y1={padTop} y2={H - padBottom} stroke="var(--color-accent)" strokeOpacity="0.35" />
        <circle cx={x(active)} cy={y(deploysPerDay[active])} r="5.5" fill="var(--color-bg)" stroke="var(--color-accent-2)" strokeWidth="2.5" />
        {deploysPerDay.map((_, i) => (
          <rect key={i} x={x(i) - step / 2} y={0} width={step} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>

      <div className="relative mt-2 h-5 text-xs">
        {dayLabels.map((d, i) => (
          <span
            key={d}
            className={`absolute -translate-x-1/2 transition-colors ${i === active ? 'text-ink' : 'text-muted'}`}
            style={{ left: `${(x(i) / W) * 100}%` }}
          >
            {d}
          </span>
        ))}
      </div>
    </section>
  )
}

function LiveLogs() {
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [n, setN] = useState(reduce ? logLines.length : 0)

  useEffect(() => {
    if (reduce) return
    const finished = n >= logLines.length
    const id = setTimeout(() => setN(finished ? 0 : n + 1), finished ? 4000 : 700)
    return () => clearTimeout(id)
  }, [n, reduce])

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-line bg-bg lg:col-span-2">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <h2 className="text-sm font-semibold">api-python</h2>
        </div>
        <span className="text-xs text-muted">Journal de build en direct</span>
      </div>
      <div className="flex h-[17.5rem] flex-col justify-end gap-1.5 overflow-hidden p-5 font-mono text-[12.5px] leading-relaxed" aria-live="off">
        {logLines.slice(0, n).map((l) => (
          <p key={l.time + l.tag} className="whitespace-nowrap">
            <span className="hidden text-muted/60 sm:inline">{l.time} </span>
            <span className={`inline-block w-11 ${toneClass[l.tone]}`}>{l.tag}</span>{' '}
            <span className={l.tone === 'ok' ? 'text-ok' : 'text-ink/80'}>{l.text}</span>
          </p>
        ))}
        <p className="text-muted/60">
          <span className="inline-block h-3.5 w-1.5 translate-y-0.5 animate-blink bg-accent-2" />
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Barre latérale                                                      */
/* ------------------------------------------------------------------ */

const nav: { label: string; icon: keyof typeof paths; active?: boolean }[] = [
  { label: 'Aperçu', icon: 'grid', active: true },
  { label: 'Projets', icon: 'cube' },
  { label: 'Données', icon: 'database' },
  { label: 'Journaux', icon: 'activity' },
  { label: 'Paramètres', icon: 'sliders' },
]

function SidebarContent({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex h-16 items-center gap-2.5 px-5 font-semibold tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-bg">S</span>
        Shipyard
      </Link>

      <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Navigation principale">
        {nav.map((item) =>
          item.active ? (
            <a key={item.label} href="#apercu" aria-current="page" className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5 text-sm font-medium text-ink">
              <Icon name={item.icon} />
              {item.label}
            </a>
          ) : (
            <span key={item.label} title="Bientôt disponible" className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted/70">
              <Icon name={item.icon} />
              {item.label}
              <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">bientôt</span>
            </span>
          ),
        )}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/80 to-accent-2/80 text-sm font-semibold text-bg">
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <button onClick={onLogout} title="Se déconnecter" aria-label="Se déconnecter" className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-ink">
          <Icon name="logout" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [drawer, setDrawer] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    setError('')
    getMe()
      .then((u) => !cancelled && setUser(u))
      .catch((err) => {
        if (cancelled) return
        // Pas de badge (ou badge expiré) : retour à la connexion
        if (!getToken()) navigate('/login', { replace: true })
        else setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      })
    return () => {
      cancelled = true
    }
  }, [navigate, attempt])

  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

  function onLogout() {
    logout()
    navigate('/', { replace: true })
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg px-6 text-center">
        <div>
          <p className="text-red-300">{error}</p>
          <button onClick={() => setAttempt((n) => n + 1)} className="mt-4 rounded-lg border border-line px-4 py-2 text-sm transition hover:border-accent">
            Réessayer
          </button>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Chargement" />
      </main>
    )
  }

  const firstName = user.name.trim().split(/\s+/)[0]
  const q = query.trim().toLowerCase()
  const visible = projects.filter(
    (p) => (filter === 'all' || p.status === filter) && `${p.name} ${p.repo} ${p.stack}`.toLowerCase().includes(q),
  )
  const count = (s: Filter) => (s === 'all' ? projects.length : projects.filter((p) => p.status === s).length)
  const totalDeploys = deploysPerDay.reduce((a, b) => a + b, 0)

  const stats = [
    { label: 'Projets', value: '3', note: '+1 cette semaine', data: [1, 1, 2, 2, 2, 3, 3], color: 'var(--color-accent-2)' },
    { label: 'En ligne', value: '1', note: 'sur 3 projets', data: [0, 1, 1, 2, 1, 1, 1], color: 'var(--color-ok)' },
    { label: 'Déploiements', value: String(totalDeploys), note: 'sur 7 jours', data: deploysPerDay, color: 'var(--color-accent)' },
    { label: 'Durée moyenne de build', value: '48 s', note: '12 s de moins que la semaine passée', data: [71, 66, 62, 58, 55, 51, 48], color: 'var(--color-accent-2)' },
  ]

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'online', label: 'En ligne' },
    { id: 'building', label: 'En build' },
    { id: 'failed', label: 'En échec' },
  ]

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Barre latérale (ordinateur) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-bg lg:block">
        <SidebarContent user={user} onLogout={onLogout} />
      </aside>

      {/* Barre latérale (téléphone) */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Fermer le menu" className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <div className="relative h-full w-72 max-w-[85%] border-r border-line bg-bg shadow-2xl">
            <button onClick={() => setDrawer(false)} aria-label="Fermer le menu" className="absolute right-3 top-4 rounded-lg p-2 text-muted hover:text-ink">
              <Icon name="x" />
            </button>
            <SidebarContent user={user} onLogout={onLogout} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Barre du haut */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line/70 bg-bg/80 px-4 backdrop-blur-xl sm:px-8">
          <button onClick={() => setDrawer(true)} aria-label="Ouvrir le menu" className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink lg:hidden">
            <Icon name="menu" className="h-5 w-5" />
          </button>

          <label className="relative max-w-md flex-1">
            <span className="sr-only">Rechercher un projet</span>
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un projet"
              className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
          </label>

          <button
            disabled
            title="Bientôt disponible"
            className="btn-shimmer ml-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-bg opacity-60"
          >
            <Icon name="plus" className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau déploiement</span>
          </button>
        </header>

        <main
          id="apercu"
          className="px-4 pb-16 pt-8 sm:px-8"
          style={{ backgroundImage: 'radial-gradient(48rem 16rem at 65% -4%, color-mix(in oklab, var(--color-accent) 13%, transparent), transparent)' }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Bonjour {firstName}</h1>
                <p className="mt-2 text-muted">Un projet est en ligne et un build est en cours.</p>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">Données de démonstration</span>
            </div>

            {/* Chiffres clés : un seul bandeau, pas quatre cartes identiques */}
            <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-4">
              {stats.map((s, i) => (
                <div key={s.label} className={`p-5 ${i % 2 === 1 ? 'border-l border-line' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''} ${i > 0 ? 'lg:border-l' : ''}`}>
                  <dt className="text-sm text-muted">{s.label}</dt>
                  <dd className="mt-2 flex items-end justify-between gap-2">
                    <span className="whitespace-nowrap text-3xl font-semibold tabular-nums leading-none">{s.value}</span>
                    <Spark data={s.data} color={s.color} />
                  </dd>
                  <p className="mt-2 text-xs text-muted">{s.note}</p>
                </div>
              ))}
            </dl>

            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <ActivityChart />
              <LiveLogs />
            </div>

            {/* Projets */}
            <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h2 className="font-semibold">Vos projets</h2>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par statut">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      aria-pressed={filter === f.id}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        filter === f.id ? 'border-accent/60 bg-accent/15 text-ink' : 'border-line text-muted hover:text-ink'
                      }`}
                    >
                      {f.label} <span className="tabular-nums text-muted">{count(f.id)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {visible.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <p className="font-medium">Aucun projet ne correspond à votre recherche</p>
                  <p className="mt-1 text-sm text-muted">Modifiez les mots saisis ou changez de filtre pour retrouver vos projets.</p>
                  <button
                    onClick={() => {
                      setQuery('')
                      setFilter('all')
                    }}
                    className="mt-4 rounded-lg border border-line px-4 py-2 text-sm transition hover:border-accent"
                  >
                    Afficher tous les projets
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted">
                      <tr className="border-b border-line">
                        <th className="px-5 py-3 font-normal">Projet</th>
                        <th className="px-5 py-3 font-normal">Statut</th>
                        <th className="hidden px-5 py-3 font-normal md:table-cell">Adresse</th>
                        <th className="hidden px-5 py-3 text-right font-normal lg:table-cell">Dernier déploiement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {visible.map((p) => {
                        const s = statusInfo[p.status]
                        return (
                          <tr key={p.name} className="transition hover:bg-surface-2/50">
                            <td className="px-5 py-4">
                              <p className="font-medium">{p.name}</p>
                              <p className="mt-0.5 text-xs text-muted">
                                {p.repo}, {p.stack}
                              </p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${s.pill}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                                {s.label}
                              </span>
                            </td>
                            <td className="hidden px-5 py-4 font-mono text-[13px] text-muted md:table-cell">{p.url}</td>
                            <td className="hidden px-5 py-4 text-right text-muted lg:table-cell">{p.when}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}