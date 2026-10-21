import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import AuthShell from "../components/auth/AuthShell"
import Button from "../components/ui/Button"
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

  const hasLength = nuevaPassword.length >= 8
  const hasUpper = /[A-Z]/.test(nuevaPassword)
  const hasDigit = /\d/.test(nuevaPassword)
  const strengthScore = [hasLength, hasUpper, hasDigit].filter(Boolean).length

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
      title="Restablecer Contraseña"
      subtitle="Crea una nueva contraseña segura para tu cuenta."
      icon={<KeyRound className="w-5 h-5" />}
    >
      {successMsg ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Contraseña Actualizada</span>
            </div>
            <p className="text-on-surface-variant">{successMsg}</p>
          </div>
          <Link
            to="/login"
            className="btn btn-primary btn-lg btn-full-width uppercase tracking-wider text-xs"
          >
            INICIAR SESIÓN
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!initialToken && (
            <div>
              <label htmlFor="reset-token" className="block label-md text-on-surface-variant mb-1.5">
                Token Temporal
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pega aquí el token temporal"
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-xs font-mono text-on-surface"
              />
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="block label-md text-on-surface-variant mb-1.5">
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
                placeholder="••••••••••••"
                className="w-full h-12 pl-10 pr-10 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
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
            <label htmlFor="confirm-password" className="block label-md text-on-surface-variant mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirm-password"
                type={showPass ? "text" : "password"}
                required
                minLength={8}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Medidor de complejidad de 3 segmentos según password_recovery/design.md */}
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((step) => {
                const active = strengthScore >= step
                const colorClass =
                  strengthScore === 1
                    ? "bg-error"
                    : strengthScore === 2
                      ? "bg-amber-500"
                      : "bg-green-500"
                return (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-colors ${
                      active ? colorClass : "bg-surface-container-highest"
                    }`}
                  />
                )
              })}
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Mínimo 8 caracteres, 1 mayúscula, 1 número.
            </p>
          </div>

          <Button
            type="submit"
            isDisabled={resetMutation.isPending}
            variant="primary"
            size="lg"
            fullWidth
            className="uppercase tracking-wider text-xs"
          >
            {resetMutation.isPending ? "ACTUALIZANDO..." : "ACTUALIZAR CONTRASEÑA"}
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-[13px] font-bold text-primary hover:underline">
              Volver a Iniciar Sesión
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}