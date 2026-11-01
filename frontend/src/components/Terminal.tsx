import { useEffect, useState } from 'react'

const lines = [
  { text: '$ shipyard deploy github.com/sara/recettes', tone: 'cmd' },
  { text: '✓ Dépôt cloné', tone: 'ok' },
  { text: '✓ Image Docker construite (12 s)', tone: 'ok' },
  { text: '✓ Conteneur démarré', tone: 'ok' },
  { text: '✓ Contrôle de santé réussi', tone: 'ok' },
  { text: '→ https://recettes-sara.shipyard.app', tone: 'url' },
] as const

const tones = {
  cmd: 'text-ink',
  ok: 'text-ok',
  url: 'text-accent-2',
}

export default function Terminal() {
    //Animation du texte du terminal
  const [visible, setVisible] = useState(1)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible((v) => (v >= lines.length + 3 ? 1 : v + 1))
    }, 900)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/90 shadow-2xl shadow-accent/10">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-muted">shipyard — terminal</span>
      </div>
      <div className="min-h-56 space-y-2 p-5 font-mono text-sm">
        {lines.slice(0, visible).map((line) => (
          <p key={line.text} className={tones[line.tone]}>
            {line.text}
          </p>
        ))}
        <span className="inline-block h-4 w-2 translate-y-0.5 animate-blink bg-muted" />
      </div>
    </div>
  )
}