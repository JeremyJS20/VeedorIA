import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, ChevronDown } from "lucide-react"
import AuthShell from "../components/auth/AuthShell"
import { useAuth } from "../context/AuthContext"

const DEMO_TENANT_ACCOUNTS = [
  {
    label: "Administración General (NexoDigital)",
    email: "admin@veedoria.gob.do",
    scope: "Cobertura Nacional · Gestión de Organizaciones",
  },
  {
    label: "Órgano Rector (DGCP / Contraloría)",
    email: "auditor@dgcp.gob.do",
    scope: "Cobertura Nacional Transversal",
  },
  {
    label: "Ministerio de Obras Públicas (MOPC)",
    email: "auditor@mopc.gob.do",
    scope: "Cobertura Institucional MOPC",
  },
  {
    label: "Ministerio de Educación (MINERD)",
    email: "auditor@minerd.gob.do",
    scope: "Cobertura Institucional MINERD",
  },
  {
    label: "Proveedor del Estado (C & S Tianmu Corp)",
    email: "proveedor@constructora.do",
    scope: "RPE 132993 · Inteligencia de Mercado",
  },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invitationCode = searchParams.get("code")
  const callbackUrl = searchParams.get("callbackUrl") || "/app/dashboard"

  const [correo, setCorreo] = useState("admin@veedoria.gob.do")
  const [contrasena, setContrasena] = useState("VeedorIA2026!")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showDemoAccounts, setShowDemoAccounts] = useState(false)
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

  return (
    <AuthShell
      title="Acceder a VeedorIA"
      subtitle="Ingresa tus credenciales para acceder a la consola"
      footer={
        <div className="bg-surface-container border border-outline-variant/40 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span>Cuentas institucionales de demostración</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showDemoAccounts ? "rotate-180" : ""}`}
            />
          </button>
          {showDemoAccounts && (
            <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 pt-3">
              {DEMO_TENANT_ACCOUNTS.map((acc) => {
                const isSelected = correo.toLowerCase() === acc.email.toLowerCase()
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setCorreo(acc.email)
                      setContrasena("VeedorIA2026!")
                      setError(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary-container/40 border-primary text-on-surface"
                        : "bg-surface-container-lowest dark:bg-surface-container-highest border-outline-variant/30 hover:border-primary/50 text-on-surface-variant"
                    }`}
                  >
                    <p className="font-semibold text-on-surface">{acc.label}</p>
                    <p className="font-mono text-[11px] text-on-surface-variant">
                      {acc.email} · {acc.scope}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {invitationCode && (
          <div className="p-3.5 rounded-xl bg-primary-container/25 border border-primary/30 text-xs text-on-surface">
            <p className="font-semibold text-primary">Código de invitación detectado: {invitationCode}</p>
            <p className="text-on-surface-variant mt-0.5">
              Inicia sesión con tu cuenta existente o{" "}
              <Link to={`/registro?code=${encodeURIComponent(invitationCode)}`} className="font-semibold text-primary underline">
                crea una cuenta nueva aquí
              </Link>
              .
            </p>
          </div>
        )}
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
          <label htmlFor="login-email" className="block label-md text-on-surface-variant mb-1.5">
            Correo Institucional
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
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block label-md text-on-surface-variant mb-1.5">
            Contraseña
          </label>
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
              className="w-full h-12 pl-10 pr-10 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
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

        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex items-center gap-2 text-[13px] text-on-surface-variant cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant accent-primary"
            />
            <span>Recordarme</span>
          </label>

          <Link
            to="/recuperar-contrasena"
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Olvidé mi contraseña
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-lg btn-full-width uppercase tracking-wider text-xs"
        >
          {isSubmitting ? "VERIFICANDO..." : "INICIAR SESIÓN"}
        </button>

        <div className="pt-3 border-t border-outline-variant/25 space-y-2.5 text-center">
          <p className="text-[13px] text-on-surface-variant">
            ?A?n no tienes una cuenta?{" "}
            <Link
              to={invitationCode ? `/registro?code=${encodeURIComponent(invitationCode)}` : "/registro"}
              className="font-semibold text-primary hover:underline"
            >
              Crear cuenta o registrar empresa
            </Link>
          </p>
          <Link
            to="/public"
            className="inline-flex items-center justify-center gap-1.5 label-md text-on-surface-variant hover:text-primary transition-colors"
          >
            <span>O CONTINUAR COMO CIUDADANO (Acceso libre sin registro)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}