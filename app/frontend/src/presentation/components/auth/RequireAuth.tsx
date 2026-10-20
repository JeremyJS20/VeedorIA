import { Link, Navigate, useLocation } from "react-router-dom"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { formatPermissionLabel } from "../../../domain/auth"
import type { ReactNode } from "react"

interface RequireAuthProps {
  children: ReactNode
  permission?: string
  allowedRoles?: string[]
  allowedTenantTypes?: string[]
}

export default function RequireAuth({
  children,
  permission,
  allowedRoles,
  allowedTenantTypes,
}: RequireAuthProps) {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-surface font-mono text-sm">
        Verificando credenciales institucionales...
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    const callbackUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?callbackUrl=${callbackUrl}`} replace />
  }

  const roleDenied =
    allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.rol?.codigo)

  const tenantTypeDenied =
    allowedTenantTypes &&
    allowedTenantTypes.length > 0 &&
    user.rol?.codigo !== "PLATFORM_ADMIN" &&
    !allowedTenantTypes.includes(user.tenant?.tipo)

  const permDenied = Boolean(permission && !hasPermission(permission))

  if (roleDenied || tenantTypeDenied || permDenied) {
    return (
      <div className="p-8 max-w-[42rem] mx-auto mt-12">
        <div className="bg-surface border border-error/30 rounded-2xl p-8 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-bold text-on-surface">
              Acceso Restringido por Rol y Nivel de Autorización
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tu perfil actual (<span className="font-semibold text-on-surface">{user.rol?.nombre}</span> ·{" "}
              <span className="font-mono text-xs text-primary">{user.tenant?.codigo}</span>) no cuenta con privilegios para acceder a esta ruta
              {permission ? (
                <>
                  {" "}
                  (requiere <span className="font-semibold text-on-surface">{formatPermissionLabel(permission)}</span>)
                </>
              ) : null}
              .
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Panorama Ejecutivo</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
