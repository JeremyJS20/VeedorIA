import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Mail, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import AuthShell from "../components/auth/AuthShell"
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
      badge="Recuperación de Acceso"
      title="Restablecer Contraseña"
      subtitle="Ingresa tu correo institucional. Si está registrado y activo, generaremos un enlace temporal válido por 15 minutos."
    >
      {submittedData ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Solicitud Procesada</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed">{submittedData.message}</p>
          </div>

          {submittedData.reset_url_preview && (
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-xs space-y-2">
              <p className="font-bold text-primary">
                Enlace de Recuperación (Modo Desarrollo / Demo):
              </p>
              <Link
                to={submittedData.reset_url_preview}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-primary underline break-all"
              >
                Abrir formulario de cambio con token temporal
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
          )}

          <Link
            to="/login"
            className="block w-full text-center py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors"
          >
            Volver al Inicio de Sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="forgot-email" className="block text-xs font-semibold text-on-surface mb-1.5">
              Correo Electrónico Institucional
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={forgotMutation.isPending}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {forgotMutation.isPending ? "Generando enlace seguro..." : "Enviar Enlace de Recuperación"}
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-semibold text-on-surface-variant hover:text-primary">
              Cancelar y volver al login
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}