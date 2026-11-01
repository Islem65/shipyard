import { useEffect, useState } from 'react'

type Props = { title: string; message?: string }

// Petite notification (pop-up) qui glisse en haut à droite de l'écran
export default function Toast({ title, message }: Props) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setShown(true), 20)
    return () => clearTimeout(id)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-ok/40 bg-surface/95 p-4 shadow-2xl shadow-ok/10 backdrop-blur-xl transition duration-300 ease-out ${
        shown ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ok/15 text-lg text-ok">✓</span>
      <div>
        <p className="font-semibold">{title}</p>
        {message && <p className="mt-0.5 text-sm text-muted">{message}</p>}
      </div>
    </div>
  )
}