import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import { signup } from '../services/api'

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>

function strength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const levels = [
  { label: 'Trop court', color: 'bg-line' },
  { label: 'Faible', color: 'bg-red-400' },
  { label: 'Moyen', color: 'bg-amber-400' },
  { label: 'Bon', color: 'bg-accent-2' },
  { label: 'Excellent', color: 'bg-ok' },
]

function validate(v: { name: string; email: string; password: string; confirm: string }): Errors {
  const e: Errors = {}

if (v.name.trim().length < 2) {
  e.name = 'Entrez votre nom (2 caractères minimum).'
} else if (!/^[\p{L}\s'-]+$/u.test(v.name.trim())) {
  e.name = 'Le nom doit contenir uniquement des lettres.'
}
  if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Entrez une adresse email valide.'
  if (v.password.length < 8) e.password = 'Le mot de passe doit contenir au moins 8 caractères.'
  if (v.confirm !== v.password) e.confirm = 'Les deux mots de passe ne sont pas identiques.'
  return e
}

export default function Signup() {
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(false)

  const score = values.password ? Math.max(strength(values.password), 1) : 0
  const level = values.password.length < 8 ? levels[values.password ? 1 : 0] : levels[score]
  const filled = values.password.length < 8 ? (values.password ? 1 : 0) : score

  const update = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setLoading(true)
    setServerError('')
    try {
      await signup({ name: values.name.trim(), email: values.email.trim(), password: values.password })
      setDone(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 animate-float place-items-center rounded-2xl border border-ok/40 bg-ok/10 text-3xl text-ok">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Compte créé</h1>
          <p className="mt-3 text-muted">
            Bienvenue sur Shipyard, {values.name.trim()}. Vous pouvez maintenant vous connecter.
          </p>
          <Link
            to="/login"
            className="btn-shimmer mt-8 block rounded-xl px-6 py-3.5 font-semibold text-bg shadow-lg shadow-accent/30 transition hover:-translate-y-0.5"
          >
            Se connecter
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Créez votre <span className="text-gradient">compte</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Gratuit, sans carte bancaire. Prêt en moins d’une minute.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field
          id="name"
          label="Nom"
          autoComplete="name"
          placeholder="Sara Ben Ali"
          value={values.name}
          onChange={update('name')}
          error={errors.name}
        />
        <Field
          id="email"
          label="Adresse email"
          type="email"
          autoComplete="email"
          placeholder="sara@exemple.com"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />
        <div>
          <Field
            id="password"
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            value={values.password}
            onChange={update('password')}
            error={errors.password}
            right={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="rounded-md px-2 py-1 text-xs text-muted transition hover:text-ink"
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            }
          />
          {values.password && (
            <div className="mt-2.5" aria-live="polite">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= filled ? level.color : 'bg-line'}`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">Force : {level.label}</p>
            </div>
          )}
        </div>
        <Field
          id="confirm"
          label="Confirmer le mot de passe"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={values.confirm}
          onChange={update('confirm')}
          error={errors.confirm}
        />

        {serverError && (
          <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-shimmer flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-bg shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg/30 border-t-bg" />}
          {loading ? 'Création du compte…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Vous avez déjà un compte ?{' '}
        <Link to="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Connexion
        </Link>
      </p>
    </AuthLayout>
  )
}