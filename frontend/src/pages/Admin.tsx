import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  deleteUser,
  getAdminOverview,
  getMe,
  getToken,
  getUsers,
  logout,
  setUserRole,
  type AdminOverview,
  type DayCount,
  type Role,
  type User,
} from '../services/api'

/* ------------------------------------------------------------------ */
/*  Constantes et petites fonctions                                     */
/* ------------------------------------------------------------------ */

type RoleFilter = 'all' | Role

const roleBadge: Record<Role, { label: string; cls: string }> = {
  admin: { label: 'Administrateur', cls: 'border-accent/40 bg-accent/15 text-ink' },
  user: { label: 'Utilisateur', cls: 'border-line text-muted' },
}

const statusMeta: Record<string, { label: string; bar: string; pill: string }> = {
  online: { label: 'En ligne', bar: 'bg-ok', pill: 'border-ok/30 bg-ok/10 text-ok' },
  building: { label: 'Build en cours', bar: 'bg-amber-400', pill: 'border-amber-400/30 bg-amber-400/10 text-amber-300' },
  pending: { label: 'En attente', bar: 'bg-muted/60', pill: 'border-line text-muted' },
  failed: { label: 'Échec', bar: 'bg-red-400', pill: 'border-red-400/30 bg-red-400/10 text-red-300' },
}
const statusOrder = ['online', 'building', 'pending', 'failed']

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

// "2026-10-31" -> date lisible, sans décalage de fuseau horaire
const dayLabel = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { ...opts, timeZone: 'UTC' })

const repoShort = (url: string) => url.replace('https://github.com/', '').replace(/\.git$/, '').replace(/\/$/, '')

/* ------------------------------------------------------------------ */
/*  Graphique : nouvelles inscriptions                                  */
/* ------------------------------------------------------------------ */

function SignupsChart({ days }: { days: DayCount[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? days.length - 1
  const W = 420
  const H = 160
  const slot = W / days.length
  const barW = Math.min(36, slot - 14)
  const max = Math.max(4, ...days.map((d) => d.count))
  const barH = (n: number) => (n / max) * (H - 12)
  const total = days.reduce((a, d) => a + d.count, 0)

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 lg:col-span-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Nouvelles inscriptions</h2>
          <p className="mt-1 text-sm text-muted">{total} sur les 7 derniers jours</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tabular-nums leading-none">{days[active].count}</p>
          <p className="mt-1 text-sm text-muted">{dayLabel(days[active].date, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-5 h-auto w-full"
        role="img"
        aria-label={`Inscriptions par jour : ${days.map((d) => `${dayLabel(d.date, { weekday: 'long' })} ${d.count}`).join(', ')}`}
        onMouseLeave={() => setHover(null)}
      >
        <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--color-line)" />
        {days.map((d, i) => {
          const h = Math.max(d.count > 0 ? barH(d.count) : 3, 3)
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)}>
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              <rect
                x={i * slot + (slot - barW) / 2}
                y={H - h}
                width={barW}
                height={h}
                rx="6"
                fill={i === active ? 'var(--color-accent)' : 'var(--color-accent-2)'}
                fillOpacity={i === active ? 1 : d.count > 0 ? 0.45 : 0.18}
              />
            </g>
          )
        })}
      </svg>

      <div className="relative mt-2 h-5 text-xs">
        {days.map((d, i) => (
          <span
            key={d.date}
            className={`absolute -translate-x-1/2 transition-colors ${i === active ? 'text-ink' : 'text-muted'}`}
            style={{ left: `${((i + 0.5) / days.length) * 100}%` }}
          >
            {dayLabel(d.date, { weekday: 'short' }).replace('.', '')}
          </span>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Répartition des sites par statut                                    */
/* ------------------------------------------------------------------ */

function StatusPanel({ byStatus, total }: { byStatus: Record<string, number>; total: number }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 lg:col-span-2">
      <h2 className="font-semibold">État des sites</h2>
      <p className="mt-1 text-sm text-muted">{total === 0 ? 'Aucun site partagé pour le moment' : `${total} site${total > 1 ? 's' : ''} sur la plateforme`}</p>

      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-surface-2" role="img" aria-label="Répartition des sites par statut">
        {total > 0 &&
          statusOrder.map((s) => {
            const n = byStatus[s] ?? 0
            return n > 0 ? <div key={s} className={statusMeta[s].bar} style={{ width: `${(n / total) * 100}%` }} /> : null
          })}
      </div>

      <ul className="mt-5 space-y-3">
        {statusOrder.map((s) => {
          const n = byStatus[s] ?? 0
          return (
            <li key={s} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${statusMeta[s].bar}`} />
                {statusMeta[s].label}
              </span>
              <span className="tabular-nums text-muted">
                <span className="font-medium text-ink">{n}</span>
                {total > 0 && ` (${Math.round((n / total) * 100)} %)`}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Admin() {
  const navigate = useNavigate()
  const [me, setMe] = useState<User | null>(null)
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setError('')
    getMe()
      .then(async (m) => {
        // Seuls les administrateurs entrent ici (le serveur vérifie aussi, à chaque requête)
        if (m.role !== 'admin') {
          navigate('/dashboard', { replace: true })
          return
        }
        const [o, u] = await Promise.all([getAdminOverview(), getUsers()])
        if (cancelled) return
        setMe(m)
        setOverview(o)
        setUsers(u)
      })
      .catch((err) => {
        if (cancelled) return
        if (!getToken()) navigate('/login', { replace: true })
        else setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      })
    return () => {
      cancelled = true
    }
  }, [navigate, attempt])

  async function refresh() {
    const [o, u] = await Promise.all([getAdminOverview(), getUsers()])
    setOverview(o)
    setUsers(u)
  }

  async function run(id: number, action: () => Promise<unknown>) {
    setBusyId(id)
    setNotice('')
    try {
      await action()
      await refresh()
    } catch (err) {
      if (!getToken()) navigate('/login', { replace: true })
      else setNotice(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setBusyId(null)
      setConfirmId(null)
    }
  }

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

  if (!me || !overview) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Chargement" />
      </main>
    )
  }

  const online = overview.projects_by_status.online ?? 0
  const pending = overview.projects_by_status.pending ?? 0
  const maxTop = Math.max(1, ...overview.top_users.map((t) => t.projects))

  const stats = [
    { label: 'Utilisateurs', value: overview.total_users, note: `+${overview.new_users_week} cette semaine` },
    { label: 'Sites partagés', value: overview.total_projects, note: pending > 0 ? `dont ${pending} en attente` : 'sur toute la plateforme' },
    { label: 'Sites en ligne', value: online, note: overview.total_projects > 0 ? `sur ${overview.total_projects} sites` : 'aucun pour le moment' },
    { label: 'Administrateurs', value: overview.admins, note: 'ont accès à cet espace' },
  ]

  const q = query.trim().toLowerCase()
  const visible = users.filter(
    (u) => (roleFilter === 'all' || u.role === roleFilter) && `${u.name} ${u.email} ${u.username ?? ''}`.toLowerCase().includes(q),
  )
  const filters: { id: RoleFilter; label: string; n: number }[] = [
    { id: 'all', label: 'Tous', n: users.length },
    { id: 'user', label: 'Utilisateurs', n: users.filter((u) => u.role === 'user').length },
    { id: 'admin', label: 'Administrateurs', n: users.filter((u) => u.role === 'admin').length },
  ]

  const actions = (u: User, self: boolean, busy: boolean) =>
    self ? (
      <span className="text-xs text-muted">Aucune action sur votre compte</span>
    ) : confirmId === u.id ? (
      <>
        <span className="hidden text-xs text-muted sm:inline">Supprimer définitivement ?</span>
        <button
          onClick={() => run(u.id, () => deleteUser(u.id))}
          disabled={busy}
          className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          Supprimer
        </button>
        <button onClick={() => setConfirmId(null)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-ink">
          Annuler
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => run(u.id, () => setUserRole(u.id, u.role === 'admin' ? 'user' : 'admin'))}
          disabled={busy}
          className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs transition hover:border-accent disabled:opacity-60"
        >
          {u.role === 'admin' ? 'Retirer admin' : 'Rendre admin'}
        </button>
        <button
          onClick={() => setConfirmId(u.id)}
          disabled={busy}
          className="rounded-lg border border-line px-3 py-1.5 text-xs text-red-300 transition hover:border-red-400/60 disabled:opacity-60"
        >
          Supprimer
        </button>
      </>
    )

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-bg">S</span>
              <span className="hidden sm:inline">Shipyard</span>
            </Link>
            <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-medium">Administration</span>
          </div>
          <div className="flex items-center gap-1 text-sm sm:gap-2">
            <Link to="/dashboard" className="whitespace-nowrap rounded-lg px-1.5 py-1.5 text-muted transition hover:text-ink sm:px-3">
              Mon espace
            </Link>
            <button onClick={onLogout} className="whitespace-nowrap rounded-lg border border-line px-2.5 py-1.5 text-muted transition hover:border-accent hover:text-ink sm:px-3">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main
        className="px-4 pb-16 pt-8 sm:px-8"
        style={{ backgroundImage: 'radial-gradient(48rem 16rem at 35% -4%, color-mix(in oklab, var(--color-accent-2) 11%, transparent), transparent)' }}
      >
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight">Vue d’ensemble de la plateforme</h1>
          <p className="mt-2 text-muted">Bonjour {me.name.split(/\s+/)[0]}. Voici l’activité de tous les comptes et de tous les sites.</p>

          <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`p-5 ${i % 2 === 1 ? 'border-l border-line' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''} ${i > 0 ? 'lg:border-l' : ''}`}>
                <dt className="text-sm text-muted">{s.label}</dt>
                <dd className="mt-2 text-3xl font-semibold tabular-nums leading-none">{s.value}</dd>
                <p className="mt-2 text-xs text-muted">{s.note}</p>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <SignupsChart days={overview.signups_per_day} />
            <StatusPanel byStatus={overview.projects_by_status} total={overview.total_projects} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <section className="overflow-hidden rounded-2xl border border-line bg-surface lg:col-span-3">
              <div className="border-b border-line px-5 py-4">
                <h2 className="font-semibold">Derniers sites partagés</h2>
              </div>
              {overview.latest_projects.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="font-medium">Aucun site partagé pour le moment</p>
                  <p className="mt-1 text-sm text-muted">Les sites apparaîtront ici dès qu’un utilisateur ajoutera un projet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {overview.latest_projects.map((p) => {
                    const m = statusMeta[p.status] ?? statusMeta.pending
                    return (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <div className="min-w-0">
                          <p className="font-medium">{p.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {repoShort(p.repo_url)}, par {p.owner_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="hidden text-xs text-muted sm:inline">{fmtDate(p.created_at)}</span>
                          <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${m.pill}`}>{m.label}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5 lg:col-span-2">
              <h2 className="font-semibold">Utilisateurs les plus actifs</h2>
              <p className="mt-1 text-sm text-muted">Classés par nombre de sites partagés</p>
              {overview.top_users.length === 0 ? (
                <p className="mt-8 text-center text-sm text-muted">Aucun utilisateur n’a encore partagé de site.</p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {overview.top_users.map((t) => (
                    <li key={t.email}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{t.name}</span>
                        <span className="shrink-0 tabular-nums text-muted">
                          {t.projects} site{t.projects > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${(t.projects / maxTop) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight">Gestion des utilisateurs</h2>
          <p className="mt-2 text-muted">Donnez ou retirez le rôle d’administrateur, supprimez un compte (ses sites sont supprimés avec lui).</p>

          <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom ou email"
                aria-label="Rechercher un utilisateur"
                className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15 sm:w-72"
              />
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par rôle">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setRoleFilter(f.id)}
                    aria-pressed={roleFilter === f.id}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      roleFilter === f.id ? 'border-accent/60 bg-accent/15 text-ink' : 'border-line text-muted hover:text-ink'
                    }`}
                  >
                    {f.label} <span className="tabular-nums text-muted">{f.n}</span>
                  </button>
                ))}
              </div>
            </div>

            {notice && (
              <p role="alert" className="border-b border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-300">
                {notice}
              </p>
            )}

            {visible.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="font-medium">Aucun utilisateur ne correspond</p>
                <p className="mt-1 text-sm text-muted">Modifiez la recherche ou le filtre pour retrouver un compte.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted">
                    <tr className="border-b border-line">
                      <th className="px-5 py-3 font-normal">Utilisateur</th>
                      <th className="px-5 py-3 font-normal">Rôle</th>
                      <th className="hidden px-5 py-3 font-normal md:table-cell">Inscrit le</th>
                      <th className="hidden px-5 py-3 text-right font-normal md:table-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {visible.map((u) => {
                      const self = u.id === me.id
                      const busy = busyId === u.id
                      const badge = roleBadge[u.role]
                      return (
                        <tr key={u.id} className="transition hover:bg-surface-2/50">
                          <td className="px-5 py-4">
                            <p className="font-medium">
                              {u.name}
                              {self && <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-xs font-normal text-muted">vous</span>}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">{u.username ? `${u.username}, ${u.email}` : u.email}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 md:hidden">{actions(u, self, busy)}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="hidden px-5 py-4 text-muted md:table-cell">{fmtDate(u.created_at)}</td>
                          <td className="hidden px-5 py-4 md:table-cell">
                            <div className="flex items-center justify-end gap-2">{actions(u, self, busy)}</div>
                          </td>
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
  )
}