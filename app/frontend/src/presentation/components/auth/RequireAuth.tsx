import { Navigate, useLocation } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { formatPermissionLabel } from "../../../domain/auth"
import type { ReactNode } from "react"

interface RequireAuthProps {
  children: ReactNode
  permission?: string
}

export default function RequireAuth({ children, permission }: RequireAuthProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-surface font-mono text-sm">
        Verificando credenciales institucionales...
      </div>
    )
  }

  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?callbackUrl=${callbackUrl}`} replace />
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="p-8 max-w-[42rem] mx-auto mt-12">
        <div className="bg-surface border border-error/30 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-on-surface mb-2">
            Acceso Restringido por Nivel de Autorización
          </h2>
          <p className="text-sm text-on-surface-variant mb-4">
            Tu cuenta no cuenta con la autorización necesaria (<span className="font-semibold text-on-surface">{formatPermissionLabel(permission)}</span>) para consultar esta sección.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}