import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Building2,
  AlertTriangle,
  ArrowRight,
  LogIn,
  UserPlus,
  ShieldCheck,
  KeyRound,
} from "lucide-react"
import Logo from "../components/Logo"
import { useInvitationInfo } from "../hooks/useAuthManagement"

const SAMPLE_CODES = [
  { code: "MOPC-B2G", label: "MOPC (Institución)" },
  { code: "MINERD-B2G", label: "MINERD (Institución)" },
  { code: "CONSTRUCTORA-B2B", label: "Constructora (Proveedor)" },
]

export default function InvitationGatewayPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const urlCode = searchParams.get("code") || ""
  const [manualCode, setManualCode] = useState(urlCode)

  const { data: info, isLoading, isError } = useInvitationInfo(urlCode || null)

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault()
    const clean = manualCode.trim().toUpperCase()
    if (clean) {
      setSearchParams({ code: clean })
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between px-4 py-8">
      <header className="w-full max-w-[80rem] mx-auto flex items-center justify-between">
        <Link to="/" className="h-9 inline-flex items-center">
          <Logo className="h-full" />
        </Link>
        <Link
          to="/login"
          className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          Acceder a mi cuenta
        </Link>
      </header>

      <main className="w-full max-w-[450px] mx-auto my-8">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/40 rounded-2xl shadow-lg p-7 space-y-6">
          {!urlCode ? (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="font-display text-xl font-bold text-on-surface">
                  Pasarela de Invitación Institucional
                </h1>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Ingrese el código de invitación suministrado por su institución pública o empresa proveedora para validar su acceso.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="invitation-code-input"
                    className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                  >
                    Código de Organización
                  </label>
                  <input
                    id="invitation-code-input"
                    type="text"
                    required
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Ej. MOPC-B2G"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full-width uppercase tracking-wider text-xs cursor-pointer"
                >
                  Validar Código de Invitación
                </button>
              </form>

              <div className="pt-3 border-t border-outline-variant/25 space-y-2">
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Códigos de demostración disponibles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_CODES.map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => {
                        setManualCode(s.code)
                        setSearchParams({ code: s.code })
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary text-[11px] font-mono text-on-surface-variant transition-colors cursor-pointer"
                    >
                      {s.code} · {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : isLoading ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-sm font-semibold text-on-surface">
                Verificando código de invitación...
              </p>
              <p className="text-xs font-mono text-on-surface-variant">{urlCode}</p>
            </div>
          ) : isError || !info ? (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h1 className="font-display text-xl font-bold text-on-surface">
                  Código Inválido o Expirado
                </h1>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  El código <span className="font-mono font-semibold text-on-surface">{urlCode}</span> no corresponde a una organización activa o su vigencia ha concluido.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <label
                  htmlFor="retry-invitation-code"
                  className="block text-xs font-semibold text-on-surface-variant"
                >
                  Intentar con otro código de invitación
                </label>
                <div className="flex gap-2">
                  <input
                    id="retry-invitation-code"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Ej. MOPC-B2G"
                    className="flex-1 h-10 px-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="px-4 h-10 rounded-xl bg-primary text-on-primary text-xs font-semibold cursor-pointer"
                  >
                    Verificar
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-outline-variant/25 flex items-center justify-between text-xs">
                <Link to="/" className="text-on-surface-variant hover:text-primary font-medium">
                  Volver al inicio
                </Link>
                <Link to="/registro" className="text-primary font-semibold hover:underline">
                  Registrar nueva empresa
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6" />
                </div>
                <h1 className="font-display text-lg font-bold text-on-surface leading-snug">
                  {info.nombre}
                </h1>
                <p className="text-xs text-on-surface-variant">
                  Ha sido invitado a integrarse a esta organización dentro de VeedorIA.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low dark:bg-surface-container-high border border-outline-variant/30 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Código verificado</span>
                  <span className="font-mono font-bold text-primary">{info.codigo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Segmento</span>
                  <span className="font-semibold text-on-surface">{info.tipo_etiqueta}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Plan activo</span>
                  <span className="font-semibold text-on-surface">{info.plan_etiqueta}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Rol asignado</span>
                  <span className="font-semibold text-on-surface">{info.rol_asignado}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => navigate(`/registro?code=${encodeURIComponent(info.codigo)}`)}
                  className="btn btn-primary btn-lg btn-full-width uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>CREAR NUEVA CUENTA</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/login?code=${encodeURIComponent(info.codigo)}`)}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant hover:border-primary text-xs font-semibold text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>INICIAR SESIÓN CON CUENTA EXISTENTE</span>
                </button>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Acceso protegido por organización
                </span>
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Cambiar código
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/public"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            <span>Explorar Portal Ciudadano sin registro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-[80rem] mx-auto text-center text-[11px] text-on-surface-variant">
        VeedorIA · Transparencia y Auditoría de Contrataciones Públicas de la República Dominicana
      </footer>
    </div>
  )
}