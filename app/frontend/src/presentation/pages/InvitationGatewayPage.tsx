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
import AuthShell from "../components/auth/AuthShell"
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

  const shellTitle = !urlCode
    ? "Pasarela de Invitación"
    : isLoading
      ? "Verificando Invitación"
      : isError || !info
        ? "Código Inválido o Expirado"
        : "Invitación Verificada"

  const shellSubtitle = !urlCode
    ? "Ingresa el código suministrado por tu institución pública o empresa proveedora"
    : isLoading
      ? `Comprobando validez del código ${urlCode}...`
      : isError || !info
        ? `El código "${urlCode}" no corresponde a una organización activa`
        : "Has sido invitado a colaborar en una organización registrada en VeedorIA"

  const shellIcon = !urlCode ? (
    <KeyRound className="w-5 h-5" />
  ) : isError ? (
    <AlertTriangle className="w-5 h-5 text-error" />
  ) : (
    <Building2 className="w-5 h-5" />
  )

  return (
    <AuthShell title={shellTitle} subtitle={shellSubtitle} icon={shellIcon}>
      {!urlCode ? (
        <div className="space-y-5">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="invitation-code-input"
                className="block label-md text-on-surface-variant mb-1.5"
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
                className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm font-mono text-on-surface focus:outline-none focus:border-primary transition-colors"
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

          <div className="pt-2 border-t border-outline-variant/25 text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              <span>VOLVER AL INICIO DE SESIÓN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono text-on-surface-variant">{urlCode}</p>
        </div>
      ) : isError || !info ? (
        <div className="space-y-5">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <label
              htmlFor="retry-code-input"
              className="block label-md text-on-surface-variant"
            >
              Intentar con otro código de invitación
            </label>
            <div className="flex gap-2">
              <input
                id="retry-code-input"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Ej. MOPC-B2G"
                className="flex-1 h-12 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 h-12 rounded-xl bg-primary text-on-primary text-xs font-semibold cursor-pointer"
              >
                Verificar
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-outline-variant/25 flex items-center justify-between text-xs">
            <Link to="/registro" className="font-semibold text-primary hover:underline">
              Ir al registro general
            </Link>
            <Link
              to="/public"
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface"
            >
              <span>Portal Ciudadano</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{info.tipo_etiqueta}</span>
              </span>
              <span className="font-mono text-xs font-semibold text-on-surface-variant">
                {info.codigo}
              </span>
            </div>
            <p className="text-base font-bold text-on-surface leading-snug">{info.nombre}</p>
            <div className="pt-2 border-t border-outline-variant/25 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[11px] text-on-surface-variant">Plan Asociado</p>
                <p className="font-semibold text-on-surface">{info.plan_etiqueta}</p>
              </div>
              <div>
                <p className="text-[11px] text-on-surface-variant">Alcance</p>
                <p className="font-semibold text-on-surface">{info.alcance}</p>
              </div>
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
              className="w-full h-12 rounded-xl border border-outline-variant hover:border-primary text-on-surface font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>INICIAR SESIÓN CON CUENTA EXISTENTE</span>
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
