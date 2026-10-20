import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Mail, Lock, ShieldCheck, AlertCircle, ExternalLink } from "lucide-react"
import AuthShell from "../components/auth/AuthShell"
import InsetPanel from "../components/ui/InsetPanel"
import { useForgotPassword } from "../hooks/useAuthManagement"

export default function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword()
  const [correo, setCorreo] = useState("")
  const [submittedData, setSubmittedData] = useState<{
    message: string
    reset_url_preview?: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await forgotMutation.mutateAsync(correo.trim())
      setSubmittedData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la solicitud.")
    }
  }

  return (
    <AuthShell
      title={submittedData ? "Enlace de Acceso Enviado" : "Recuperar Contraseña"}
      subtitle={
        submittedData
          ? `Hemos enviado instrucciones para restablecer tu contraseña a ${correo}. Revisa tu bandeja de entrada.`
          : "Ingresa tu correo para recibir un enlace de restablecimiento seguro."
      }
      icon={
        submittedData ? (
          <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <Lock className="w-5 h-5" />
        )
      }
    >
      {submittedData ? (
        <div className="space-y-4">
          <InsetPanel className="!p-4 text-center">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              El enlace enviado tiene una validez de <span className="font-mono font-bold text-on-surface">15 minutos</span> por razones de seguridad institucional.
            </p>
          </InsetPanel>

          {submittedData.reset_url_preview && (
            <div className="p-3.5 rounded-xl bg-primary-container/30 border border-primary/40 text-xs space-y-1.5">
              <p className="font-semibold text-on-surface">
                Enlace directo de prueba (Entorno Local):
              </p>
              <Link
                to={submittedData.reset_url_preview}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-primary underline break-all"
              >
                Abrir formulario de restablecimiento
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
          )}

          <Link
            to="/login"
            className="btn btn-primary btn-lg btn-full-width uppercase tracking-wider text-xs"
          >
            VOLVER AL LOGIN
          </Link>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setSubmittedData(null)}
              className="text-[13px] font-medium text-on-surface-variant hover:text-primary cursor-pointer"
            >
              Reenviar correo de restablecimiento
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="forgot-email" className="block label-md text-on-surface-variant mb-1.5">
              Correo Institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="forgot-email"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="auditor@mopc.gob.do"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={forgotMutation.isPending}
            className="btn btn-primary btn-lg btn-full-width uppercase tracking-wider text-xs"
          >
            {forgotMutation.isPending ? "ENVIANDO..." : "ENVIAR ENLACE"}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-[13px] font-bold text-primary hover:underline"
            >
              Volver a Iniciar Sesión
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}