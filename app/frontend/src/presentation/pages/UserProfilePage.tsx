import { useState, type FormEvent } from "react"
import { Shield, Building2, KeyRound, CheckCircle2, AlertCircle, UserCheck } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useChangePassword } from "../hooks/useAuthManagement"
import InsetPanel from "../components/ui/InsetPanel"
import {
  formatPlanLabel,
  formatTenantTypeLabel,
  formatPermissionLabel,
} from "../../domain/auth"

export default function UserProfilePage() {
  const { user } = useAuth()
  const changePasswordMutation = useChangePassword()

  const [passwordActual, setPasswordActual] = useState("")
  const [nuevaPassword, setNuevaPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!user) return null

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    if (nuevaPassword !== confirmarPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.")
      return
    }
    try {
      const res = await changePasswordMutation.mutateAsync({
        password_actual: passwordActual,
        nueva_password: nuevaPassword,
        confirmar_password: confirmarPassword,
      })
      setSuccessMsg(res.message)
      setPasswordActual("")
      setNuevaPassword("")
      setConfirmarPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la contraseña.")
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-[72rem] mx-auto space-y-6">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
          Identidad y Seguridad Institucional
        </span>
        <h1 className="font-display text-2xl font-bold text-on-surface mt-1">
          Mi Perfil Institucional
        </h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Información de tu cuenta, entidad adscrita, permisos de acceso y gestión de contraseña.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <InsetPanel className="space-y-5">
            <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold text-lg">
                {user.nombre
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-on-surface">{user.nombre}</h2>
                <p className="text-xs font-mono text-on-surface-variant">{user.correo}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-on-surface-variant block mb-1">Cargo Institucional</span>
                <span className="font-semibold text-on-surface">{user.cargo || "No especificado"}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-on-surface-variant block mb-1">Estado de Cuenta</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{user.estado}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 sm:col-span-2">
                <span className="text-on-surface-variant block mb-1">Rol Institucional Asignado</span>
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <UserCheck className="w-4 h-4" />
                  <span>{user.rol.nombre}</span>
                </div>
              </div>
            </div>
          </InsetPanel>

          {user.tenant && (
            <InsetPanel className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-sm font-bold text-on-surface">
                    Entidad u Organización Adscrita
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {formatPlanLabel(user.tenant.plan_tier)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <span className="text-on-surface-variant block">Nombre de la Organización</span>
                  <span className="font-bold text-on-surface mt-0.5 block">{user.tenant.nombre}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <span className="text-on-surface-variant block">Tipo de Organización</span>
                  <span className="font-semibold text-on-surface mt-0.5 block">
                    {formatTenantTypeLabel(user.tenant.tipo)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low sm:col-span-2">
                  <span className="text-on-surface-variant block">Alcance de Consulta y Auditoría</span>
                  <span className="font-semibold text-on-surface mt-0.5 block">
                    {user.tenant.tipo === "GOV_INSTITUTION"
                      ? `Cobertura exclusiva para procesos de ${user.tenant.nombre}`
                      : user.tenant.tipo === "B2B_SUPPLIER"
                        ? `Entorno empresarial para proveedor registrado (RPE #${user.tenant.supplier_rpe})`
                        : "Cobertura transversal nacional sobre todas las unidades de compra del Estado"}
                  </span>
                </div>
              </div>
            </InsetPanel>
          )}

          <InsetPanel className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-bold text-on-surface">
                Autorizaciones Habilitadas en tu Cuenta ({user.permisos.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.permisos.map((perm) => (
                <span
                  key={perm}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface"
                >
                  {formatPermissionLabel(perm)}
                </span>
              ))}
            </div>
          </InsetPanel>
        </div>

        <div className="lg:col-span-5">
          <InsetPanel className="space-y-4">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-display text-sm font-bold text-on-surface">Cambiar Contraseña</h3>
                <p className="text-xs text-on-surface-variant">
                  Actualiza tu clave de acceso institucional.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              <div>
                <label
                  htmlFor="current-pass"
                  className="block text-xs font-semibold text-on-surface mb-1"
                >
                  Contraseña Actual
                </label>
                <input
                  id="current-pass"
                  type="password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface"
                />
              </div>

              <div>
                <label htmlFor="new-pass" className="block text-xs font-semibold text-on-surface mb-1">
                  Nueva Contraseña (mínimo 8 caracteres, mayúscula y número)
                </label>
                <input
                  id="new-pass"
                  type="password"
                  required
                  minLength={8}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-pass"
                  className="block text-xs font-semibold text-on-surface mb-1"
                >
                  Confirmar Nueva Contraseña
                </label>
                <input
                  id="confirm-pass"
                  type="password"
                  required
                  minLength={8}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface"
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {changePasswordMutation.isPending ? "Actualizando..." : "Guardar Nueva Contraseña"}
              </button>
            </form>
          </InsetPanel>
        </div>
      </div>
    </div>
  )
}