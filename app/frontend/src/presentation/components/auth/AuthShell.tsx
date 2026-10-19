import { type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, LockKeyhole, Building2, ArrowLeft } from "lucide-react"
import Logo from "../Logo"

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

const PILLARS = [
  {
    icon: Building2,
    title: "Aislamiento Multi-Tenant B2G / B2B",
    description:
      "Cada ministerio (MOPC, MINERD), ente rector (DGCP) o proveedor opera bajo su propio espacio aislado y plan de suscripción.",
  },
  {
    icon: ShieldCheck,
    title: "Control de Acceso Relacional (RBAC)",
    description:
      "Roles jerárquicos con permisos granulares validados por criptografía y alcances automáticos por institución.",
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
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-background text-on-surface">
      {/* Columna izquierda: Panel institucional sobrio */}
      <aside className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-slate-950 text-white p-10 xl:p-12 flex-col justify-between border-r border-slate-800">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.30), transparent 45%), radial-gradient(circle at 80% 80%, rgba(15, 23, 42, 0.8), transparent 45%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left focus:outline-none cursor-pointer"
          >
            <Logo className="h-9" />
          </button>
        </div>

        <div className="relative z-10 space-y-6 my-auto py-8">
          <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
            Monitoreo Inteligente y Auditoría Forense de Contrataciones Públicas
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Acceso unificado para Unidades de Cumplimiento Ministerial (B2G), Analistas de Órganos Rectores (DGCP / Contraloría) y Proveedores del Estado (B2B).
          </p>

          <div className="space-y-3 pt-2">
            {PILLARS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 rounded-xl border border-slate-800/90 bg-slate-900/60 p-4"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">{item.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          <span>NexoDigital SRL · VeedorIA</span>
          <span className="font-mono text-[11px] text-slate-400">República Dominicana</span>
        </div>
      </aside>

      {/* Columna derecha: Formulario de autenticación con ancho explícito en rem */}
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
          <div className="lg:hidden">
            <Logo className="h-8" />
          </div>
        </div>

        <div className="w-full max-w-[32rem] mx-auto my-8">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">{title}</h2>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{subtitle}</p>
            </div>

            {children}
          </div>

          {footer && <div className="mt-5">{footer}</div>}
        </div>

        <div className="text-center text-[11px] text-on-surface-variant">
          Acceso institucional protegido · VeedorIA
        </div>
      </main>
    </div>
  )
}