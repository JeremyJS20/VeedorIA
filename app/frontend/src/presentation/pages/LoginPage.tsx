import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, Lock, Mail, AlertCircle, Building2, Shield, Briefcase } from "lucide-react"
import AuthShell from "../components/auth/AuthShell"
import { useAuth } from "../context/AuthContext"

const DEMO_TENANT_ACCOUNTS = [
  {
    label: "Admin Global (NexoDigital)",
    email: "admin@veedoria.gob.do",
    plan: "PLATFORM_GLOBAL",
    scope: "Alcance Nacional + Admin SaaS",
    icon: Shield,
  },
  {
    label: "Ente Rector (DGCP / Contraloría)",
    email: "auditor@dgcp.gob.do",
    plan: "B2G_ENTERPRISE",
    scope: "Alcance Nacional (Todas las instituciones)",
    icon: Shield,
  },
  {
    label: "Ministerio MOPC (B2G Premium)",
    email: "auditor@mopc.gob.do",
    plan: "B2G_PREMIUM",
    scope: "Aislado a MOPC (ID #5)",
    icon: Building2,
  },
  {
    label: "Ministerio MINERD (B2G Básico)",
    email: "auditor@minerd.gob.do",
    plan: "B2G_BASIC",
    scope: "Aislado a MINERD (ID #88)",
    icon: Building2,
  },
  {
    label: "Proveedor B2B (C & S Tianmu Corp)",
    email: "proveedor@constructora.do",
    plan: "B2B_CORPORATE",
    scope: "RPE 132993 · Inteligencia B2B",
    icon: Briefcase,
  },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/app/bandeja"

  const [correo, setCorreo] = useState("admin@veedoria.gob.do")
  const [contrasena, setContrasena] = useState("VeedorIA2026!")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(correo.trim(), contrasena)
      navigate(callbackUrl, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemoAccount = (email: string) => {
    setCorreo(email)
    setContrasena("VeedorIA2026!")
    setError(null)
  }

  return (
    <AuthShell
      badge="Autenticación Multi-Tenant"
      title="Iniciar Sesión Institucional"
      subtitle="Ingresa tus credenciales asignadas a tu institución (B2G), órgano rector o empresa proveedora (B2B)."
      footer={
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Cuentas Multi-Tenant Semilla (Clave: VeedorIA2026!)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
              Click para autocompletar
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_TENANT_ACCOUNTS.map((acc) => {
              const Icon = acc.icon
              const isSelected = correo.toLowerCase() === acc.email.toLowerCase()
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemoAccount(acc.email)}
                  className={`flex items-center justify-between text-left px-3 py-2 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-on-surface"
                      : "bg-surface-container-low/60 border-outline-variant/20 hover:bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-on-surface truncate">{acc.label}</p>
                      <p className="text-[11px] text-on-surface-variant font-mono truncate">
                        {acc.email} · {acc.scope}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface border border-outline-variant/30 shrink-0 ml-2">
                    {acc.plan}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-on-surface mb-1.5">
            Correo Electrónico Institucional
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@institucion.gob.do"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-on-surface">
              Contraseña
            </label>
            <Link
              to="/recuperar-contrasena"
              className="text-xs font-semibold text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-95 disabled:opacity-50 transition-all shadow-md cursor-pointer"
        >
          {isSubmitting ? "Verificando credenciales..." : "Acceder a la Consola VeedorIA"}
        </button>
      </form>
    </AuthShell>
  )
}