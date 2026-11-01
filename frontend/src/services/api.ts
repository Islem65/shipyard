// Tous les appels au backend passent par ce fichier.
// Adresse du backend
const API_URL = 'http://localhost:8000'
const TOKEN_KEY = 'shipyard_token'

const UNREACHABLE = 'Impossible de joindre le serveur. Vérifiez que le backend est lancé.'

// --- Le badge (jeton) est gardé dans le navigateur ---
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

// Déconnecter l'utilisateur en supprimant son jeton du navigateur
export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // stockage indisponible : rien à supprimer
  }
}

// Récupère le message d'erreur envoyé par le backend et le rend lisible
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body.detail === 'string') return body.detail
  } catch {
    // la réponse n'est pas du JSON : on garde le message par défaut
  }
  return fallback
}

// Envoie des données JSON au backend (sans jeton : inscription, connexion)
async function post(path: string, body: unknown): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(UNREACHABLE)
  }
}

// Envoie une requête AVEC le badge (jeton) dans l'en-tête Authorization
// (pour toutes les routes qui demandent d'être connecté)
async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  if (!token) throw new Error('Non connecté.')
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error(UNREACHABLE)
  }
  if (res.status === 401) {
    logout() // badge expiré ou invalide
    throw new Error('Session expirée. Reconnectez-vous.')
  }
  if (!res.ok) throw new Error(await errorMessage(res, 'Erreur du serveur.'))
  return res
}

// --- Inscription ---
export type SignupData = { name: string; email: string; password: string }

export async function signup(data: SignupData): Promise<void> {
  const res = await post('/auth/register', data)
  if (!res.ok) throw new Error(await errorMessage(res, "Échec de l'inscription."))
}

// --- Connexion ---
// identifier = l'email OU le nom d'utilisateur
export type LoginData = { identifier: string; password: string }

export async function login(data: LoginData): Promise<void> {
  const res = await post('/auth/login', data)
  if (!res.ok) throw new Error(await errorMessage(res, 'Échec de la connexion.'))
  const { access_token } = await res.json()
  try {
    localStorage.setItem(TOKEN_KEY, access_token)
  } catch {
    throw new Error("Impossible d'enregistrer la session dans le navigateur.")
  }
}

// --- Utilisateur connecté ---
export type Role = 'user' | 'admin'
export type User = { id: number; name: string; username: string | null; email: string; role: Role; created_at: string }

// Qui suis-je ? (route protégée)
export async function getMe(): Promise<User> {
  const res = await authFetch('/auth/me')
  return res.json()
}

// --- Espace administrateur ---
export type DayCount = { date: string; count: number }
export type AdminProject = {
  id: number
  name: string
  repo_url: string
  status: string
  created_at: string
  owner_name: string
  owner_email: string
}
export type TopUser = { name: string; email: string; projects: number }
export type AdminOverview = {
  total_users: number
  admins: number
  new_users_week: number
  total_projects: number
  projects_by_status: Record<string, number>
  signups_per_day: DayCount[]
  latest_projects: AdminProject[]
  top_users: TopUser[]
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await authFetch('/admin/overview')
  return res.json()
}

export async function getUsers(): Promise<User[]> {
  const res = await authFetch('/admin/users')
  return res.json()
}

export async function setUserRole(id: number, role: Role): Promise<User> {
  const res = await authFetch(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
  return res.json()
}

export async function deleteUser(id: number): Promise<void> {
  await authFetch(`/admin/users/${id}`, { method: 'DELETE' })
}