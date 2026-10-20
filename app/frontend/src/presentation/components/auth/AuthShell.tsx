import { type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Shield } from "lucide-react"
import Logo from "../Logo"
import ThemeToggler from "../ThemeToggler"
import LanguageSwitcher from "../LanguageSwitcher"

interface AuthShellProps {
  title: string
  subtitle: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({ title, subtitle, icon, children, footer }: AuthShellProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background text-on-surface font-sans">
      {/* Header utilitario institucional */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="cursor-pointer focus:outline-none"
          aria-label="Ir al inicio de VeedorIA"
        >
          <Logo className="h-9" />
        </button>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggler />
        </div>
      </header>

      {/* Contenedor central (450px según login_register/design.md) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-[450px]">
          <div className="bg-surface-container-lowest dark:bg-surface-container-highest border border-outline-variant/40 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-11 h-11 rounded-xl bg-primary-container/50 text-primary flex items-center justify-center mx-auto mb-3.5">
                {icon || <Shield className="w-5 h-5" />}
              </div>
              <h1 className="font-display text-[24px] font-bold text-on-surface tracking-tight leading-snug">
                {title}
              </h1>
              <p className="text-[14px] text-on-surface-variant mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {children}
          </div>

          {footer && <div className="mt-5">{footer}</div>}
        </div>
      </main>

      <footer className="w-full py-5 text-center font-mono text-[11px] text-outline">
        VeedorIA · Ley 47-25 de Contrataciones Públicas
      </footer>
    </div>
  )
}