import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, Lock, Mail, AlertCircle, Building2, Shield, Briefcase } from "lucide-react"
import AuthShell from "../components/auth/AuthShell"
import InsetPanel from "../components/ui/InsetPanel"
import { useAuth } from "../context/AuthContext"

const DEMO_TENANT_ACCOUNTS = [
  {
    label: "Admin Global (NexoDigital)",
    email: "admin@veedoria.gob.do",
    scope: "Alcance Nacional + Administración SaaS",
    icon: Shield,
  },
  {
    label: "Ente Rector (DGCP / Contraloría)",
    email: "auditor@dgcp.gob.do",
    scope: "Alcance Nacional (Todas las instituciones)",
    icon: Shield,
  },
  {
    label: "Ministerio de Obras Públicas (MOPC)",
    email: "auditor@mopc.gob.do",
    scope: "Aislado a MOPC (Institución #5)",
    icon: Building2,
  },
  {
    label: "Ministerio de Educación (MINERD)",
    email: "auditor@minerd.gob.do",
    scope: "Aislado a MINERD (Institución #88)",
    icon: Building2,
  },
  {
    label: "Proveedor del Estado (C & S Tianmu Corp)",
    email: "proveedor@constructora.do",
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
      title="Iniciar Sesión Institucional"
      subtitle="Ingresa las credenciales asignadas a tu institución (B2G), órgano rector o empresa proveedora (B2B)."
      footer={
        <InsetPanel className="!p-5">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
            Cuentas de Demostración Multi-Tenant (Clave: <span className="font-mono text-on-surface">VeedorIA2026!</span>)
          </p>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_TENANT_ACCOUNTS.map((acc) => {
              const Icon = acc.icon
              const isSelected = correo.toLowerCase() === acc.email.toLowerCase()
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemoAccount(acc.email)}
                  className={`flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary-container/30 border-primary text-on-surface"
                      : "bg-surface border-outline-variant/40 hover:bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <div className="truncate">
                      <p className="font-display font-bold text-on-surface truncate">{acc.label}</p>
                      <p className="text-[11px] text-on-surface-variant font-mono truncate mt-0.5">
                        {acc.email} · {acc.scope}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </InsetPanel>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="login-email"
            className="block font-display text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2"
          >
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
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container border border-outline-variant text-sm font-mono text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="login-password"
              className="block font-display text-xs font-bold uppercase tracking-wider text-on-surface-variant"
            >
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
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface-container border border-outline-variant text-sm font-mono text-on-surface focus:outline-none focus:border-primary transition-colors"
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
          className="btn btn-primary btn-md btn-full-width"
        >
          {isSubmitting ? "Verificando credenciales..." : "Acceder a la Consola VeedorIA"}
        </button>
      </form>
    </AuthShell>
  )
}