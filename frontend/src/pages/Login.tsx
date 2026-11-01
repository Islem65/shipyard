import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import Toast from '../components/Toast'
import { getMe, login } from '../services/api'

type Errors = Partial<Record<'identifier' | 'password', string>>

export default function Login() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ identifier: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [welcome, setWelcome] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  // Si on quitte la page avant la redirection, on annule le minuteur
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const update = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const found: Errors = {}
    if (values.identifier.trim().length === 0) found.identifier = 'Entrez votre email ou votre nom d’utilisateur.'
    if (values.password.length === 0) found.password = 'Entrez votre mot de passe.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setLoading(true)
    setServerError('')
    try {
      await login({ identifier: values.identifier.trim(), password: values.password })
      // Succès : on regarde le rôle pour choisir le bon espace
      const me = await getMe()
      setIsAdmin(me.role === 'admin')
      setWelcome(true)
      timer.current = window.setTimeout(() => navigate(me.role === 'admin' ? '/admin' : '/dashboard'), 1400)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {welcome && (
        <Toast
          title="Connexion réussie"
          message={isAdmin ? 'Redirection vers l’espace administrateur…' : 'Redirection vers votre tableau de bord…'}
        />
      )}

      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Bon <span className="text-gradient">retour</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Connectez-vous pour retrouver vos déploiements.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field
          id="identifier"
          label="Email ou nom d’utilisateur"
          autoComplete="username"
          placeholder="sara@exemple.com ou islem"
          value={values.identifier}
          onChange={update('identifier')}
          error={errors.identifier}
        />
        <Field
          id="password"
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Votre mot de passe"
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
          {welcome ? 'Redirection…' : loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link to="/signup" className="font-medium text-ink underline-offset-4 hover:underline">
          S’inscrire
        </Link>
      </p>
    </AuthLayout>
  )
}