//Il organise la navigation, le fond, le centrage et le conteneur du formulaire.
import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Reveal from './Reveal'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-bg">
      <Navbar />
      <main className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="glow pointer-events-none absolute left-1/2 top-[-60px] h-[520px] w-[820px] animate-aurora" />
        <div className="glow pointer-events-none absolute left-1/2 top-[160px] h-[420px] w-[620px] animate-aurora-slow opacity-60" />
        <Reveal className="relative w-full max-w-md">
          <div className="border-spin rounded-3xl p-8 shadow-2xl shadow-accent/10 sm:p-10">{children}</div>
        </Reveal>
      </main>
    </div>
  )
}