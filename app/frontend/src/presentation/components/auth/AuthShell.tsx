import { type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, LockKeyhole, Building2, ArrowLeft } from "lucide-react"
import Logo from "../Logo"
import ThemeToggler from "../ThemeToggler"
import LanguageSwitcher from "../LanguageSwitcher"
import InsetPanel from "../ui/InsetPanel"

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

const PILLARS = [
  {
    icon: Building2,
    title: "Aislamiento Multi-Tenant B2G y B2B",
    description:
      "Cada ministerio (MOPC, MINERD), ente rector (DGCP) o proveedor opera bajo su propio espacio aislado y plan de suscripción.",
  },
  {
    icon: ShieldCheck,
    title: "Control de Acceso Relacional (RBAC)",
    description:
      "Roles jerárquicos con permisos granulares validados criptográficamente y alcances automáticos por unidad compradora.",
  },
  {
    icon: LockKeyhole,
    title: "Seguridad y Trazabilidad Forense",
    description:
      "Protección ante fuerza bruta (bloqueo tras 5 intentos), hashes bcrypt y recuperación segura con tokens temporales.",
  },
]

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-background text-on-surface font-sans">
      {/* Columna izquierda: Panel institucional GovTech usando los tokens nativos del sistema */}
      <aside className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-surface-container-low border-r border-outline-variant/40 p-10 xl:p-12 flex-col justify-between">
        <div
          className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full hero-blur blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left focus:outline-none cursor-pointer"
            aria-label="Ir al inicio de VeedorIA"
          >
            <Logo className="h-10" />
          </button>
        </div>

        <div className="relative z-10 space-y-6 my-auto py-8">
          <h1 className="font-display text-3xl xl:text-4xl font-bold tracking-tight text-on-surface leading-tight">
            Monitoreo Inteligente y Auditoría Forense de Contrataciones Públicas
          </h1>
          <p className="body-lg text-on-surface-variant">
            Acceso institucional unificado para Unidades de Cumplimiento Ministerial (B2G), Analistas de Órganos Rectores (DGCP / Contraloría) y Proveedores del Estado (B2B).
          </p>

          <div className="space-y-3 pt-2">
            {PILLARS.map((item) => {
              const Icon = item.icon
              return (
                <InsetPanel key={item.title} className="!p-4">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-display text-sm font-bold text-on-surface">
                        {item.title}
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </InsetPanel>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-on-surface-variant border-t border-outline-variant/40 pt-4">
          <span className="font-medium">NexoDigital SRL · VeedorIA</span>
          <span className="font-mono text-[11px] text-outline">República Dominicana</span>
        </div>
      </aside>

      {/* Columna derecha: Formulario con GlassCard y tipografía Manrope + Inter + JetBrains Mono */}
      <main className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-background">
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Portal Público Ciudadano
          </button>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggler />
          </div>
        </div>

        <div className="w-full max-w-[34rem] mx-auto my-8">
          <div className="glass-card glass-card-glow">
            <div className="mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {title}
              </h2>
              <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {children}
          </div>

          {footer && <div className="mt-5">{footer}</div>}
        </div>

        <div className="text-center font-mono text-[11px] text-outline">
          VeedorIA · Ley 47-25 de Contrataciones Públicas
        </div>
      </main>
    </div>
  )
}