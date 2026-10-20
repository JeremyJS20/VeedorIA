import { ShieldCheck, Check, Minus, Layers, Building2 } from "lucide-react"
import { useRolesMatrix } from "../hooks/useAuthManagement"
import { formatPlanLabel, formatPermissionLabel } from "../../domain/auth"

export default function RolesMatrixPage() {
  const { data, isLoading, error } = useRolesMatrix()

  if (isLoading) {
    return (
      <div className="p-8 text-sm font-mono text-on-surface-variant">
        Cargando catálogo de roles, permisos y planes de servicio...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-sm text-error">
        No fue posible cargar el catálogo de roles: {error instanceof Error ? error.message : "Error"}
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-8">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
          Gobernanza y Control de Acceso
        </span>
        <h1 className="font-display text-2xl font-bold text-on-surface mt-1">
          Catálogo de Roles y Planes de Servicio
        </h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Estructura de autorizaciones por perfil institucional combinada con los alcances de suscripción para entidades públicas y proveedores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.roles.map((role) => (
          <div
            key={role.id}
            className="inset-panel flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Rol Institucional
                </span>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-display text-sm font-bold text-on-surface">{role.nombre}</h2>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                {role.descripcion}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Autorizaciones / Usuarios</span>
              <span className="font-mono font-bold text-on-surface">
                {role.permisos.length} permisos · {role.usuarios_count} usuarios
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20 flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">
              Matriz de Autorizaciones por Rol ({data.permisos.length} permisos × {data.roles.length} roles)
            </h2>
            <p className="text-xs text-on-surface-variant">
              Permisos verificados automáticamente en cada operación de la plataforma.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant uppercase font-mono text-[11px]">
                <th className="py-3 px-4">Autorización</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Plan Requerido</th>
                <th className="py-3 px-4">Descripción Funcional</th>
                {data.roles.map((r) => (
                  <th key={r.id} className="py-3 px-4 text-center">
                    {r.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {data.permisos.map((perm) => (
                <tr key={perm.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-primary">
                    {formatPermissionLabel(perm.codigo)}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-on-surface">{perm.modulo}</td>
                  <td className="py-2.5 px-4 text-[11px] font-medium">
                    {formatPlanLabel(perm.plan_minimo)}
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">{perm.descripcion}</td>
                  {data.roles.map((r) => {
                    const hasPerm = r.permisos.includes(perm.codigo)
                    return (
                      <td key={r.id} className="py-2.5 px-4 text-center">
                        {hasPerm ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 text-outline/40">
                            <Minus className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20 flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">
              Catálogo de Planes de Suscripción Institucional y Empresarial
            </h2>
            <p className="text-xs text-on-surface-variant">
              Define la cobertura por institución pública o proveedor del Estado y las capacidades habilitadas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {data.planes_saas.map((tier) => (
            <div
              key={tier.codigo}
              className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-primary">
                    {formatPlanLabel(tier.codigo)}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface border border-outline-variant/30 text-on-surface-variant">
                    {tier.segmento === "B2G"
                      ? "Sector Público"
                      : tier.segmento === "B2B"
                        ? "Proveedores"
                        : "Administración"}
                  </span>
                </div>
                <p className="text-xs font-bold text-on-surface">{tier.nombre}</p>
                <p className="text-[11px] text-on-surface-variant mt-1">{tier.alcance}</p>
              </div>
              <ul className="space-y-1 pt-2 border-t border-outline-variant/20">
                {tier.capacidades.map((fn) => (
                  <li key={fn} className="text-[11px] text-on-surface flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-primary shrink-0" />
                    <span>{fn}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}