//ce fichier crée les zones de saisie avec leurs labels et leurs messages d'erreur éventuels.
import type { InputHTMLAttributes, ReactNode } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  right?: ReactNode
}

export default function Field({ label, error, right, id, ...input }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-bg px-4 py-3 text-ink outline-none transition placeholder:text-muted/60 focus:ring-4 ${
            error
              ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/15'
              : 'border-line focus:border-accent focus:ring-accent/20'
          } ${right ? 'pr-20' : ''}`}
          {...input}
        />
        {right && <div className="absolute inset-y-0 right-3 flex items-center">{right}</div>}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}