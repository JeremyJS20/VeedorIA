import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import AuthShell from "../components/auth/AuthShell"
import { useResetPassword } from "../hooks/useAuthManagement"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const initialToken = searchParams.get("token") || ""
  const resetMutation = useResetPassword()

  const [token, setToken] = useState(initialToken)
  const [nuevaPassword, setNuevaPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }
    try {
      const res = await resetMutation.mutateAsync({
        token: token.trim(),
        nueva_password: nuevaPassword,
        confirmar_password: confirmarPassword,
      })
      setSuccessMsg(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible restablecer la contraseña.")
    }
  }

  return (
    <AuthShell
      title="Definir Nueva Contraseña"
      subtitle="La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas y números."
    >
      {successMsg ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Contraseña Actualizada</span>
            </div>
            <p className="text-on-surface-variant">{successMsg}</p>
          </div>
          <Link
            to="/login"
            className="block w-full text-center py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs"
          >
            Iniciar Sesión con Nueva Contraseña
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

          {!initialToken && (
            <div>
              <label htmlFor="reset-token" className="block text-xs font-semibold text-on-surface mb-1.5">
                Token Temporal de Recuperación
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pega aquí el token temporal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-mono text-on-surface"
              />
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold text-on-surface mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="new-password"
                type={showPass ? "text" : "password"}
                required
                minLength={8}
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres (Mayúscula + Número)"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-xs font-semibold text-on-surface mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirm-password"
              type={showPass ? "text" : "password"}
              required
              minLength={8}
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface"
            />
          </div>

          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {resetMutation.isPending ? "Guardando nueva contraseña..." : "Restablecer Contraseña"}
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-semibold text-on-surface-variant hover:text-primary">
              Volver al Inicio de Sesión
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}