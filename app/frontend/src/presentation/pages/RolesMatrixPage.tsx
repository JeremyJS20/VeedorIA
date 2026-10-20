import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ShieldCheck,
  Check,
  Minus,
  Layers,
  Building2,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { useRolesMatrix } from "../hooks/useAuthManagement"
import { formatPlanLabel, formatPermissionLabel } from "../../domain/auth"

const MODULE_LABELS: Record<string, string> = {
  ALL: "Todos los Módulos",
  AUDITORIA: "Auditoría e Investigación",
  PROCESOS: "Procesos y Expedientes",
  DETECCION: "Motores y Calibración",
  PROVEEDORES: "Inteligencia Comercial",
  SEGURIDAD: "Gobernanza y Seguridad",
}

const PLAN_PRICING_META: Record<
  string,
  { price: string; period: string; badge: string; highlight?: boolean }
> = {
  B2G_BASIC: {
    price: "Incluido en Convenio Base",
    period: "Entidades Públicas",
    badge: "Fiscalización Preventiva",
  },
  B2G_PREMIUM: {
    price: "Licencia Institucional",
    period: "Ministerios y Direcciones",
    badge: "Auditoría Forense Completa",
    highlight: true,
  },
  B2G_ENTERPRISE: {
    price: "Convenio Nacional",
    period: "Órganos Rectores y de Control",
    badge: "Cobertura Nacional Transversal",
  },
  B2B_PYME: {
    price: "RD$ 2,900",
    period: "/ mes por empresa",
    badge: "Proveedores Pyme",
  },
  B2B_CORPORATE: {
    price: "RD$ 8,500",
    period: "/ mes por empresa",
    badge: "Proveedores Corporativos",
    highlight: true,
  },
  PLATFORM_GLOBAL: {
    price: "Uso Interno",
    period: "NexoDigital Solutions",
    badge: "Gobierno de Plataforma",
  },
}

export default function RolesMatrixPage() {
  const [searchParams] = useSearchParams()
  const activeSection = searchParams.get("seccion") === "planes" ? "planes" : "roles"

  const [selectedRoleCode, setSelectedRoleCode] = useState<string | null>(null)
  const [selectedModule, setSelectedModule] = useState<string>("ALL")
  const [searchPerm, setSearchPerm] = useState<string>("")
  const [selectedSegment, setSelectedSegment] = useState<"ALL" | "B2G" | "B2B" | "PLATFORM">("ALL")

  const { data, isLoading, error } = useRolesMatrix()

  const filteredPermissions = useMemo(() => {
    if (!data) return []
    return data.permisos.filter((perm) => {
      if (selectedModule !== "ALL" && perm.modulo !== selectedModule) return false
      if (searchPerm.trim()) {
        const q = searchPerm.toLowerCase()
        const label = formatPermissionLabel(perm.codigo).toLowerCase()
        const desc = perm.descripcion.toLowerCase()
        if (!label.includes(q) && !desc.includes(q) && !perm.modulo.toLowerCase().includes(q)) {
          return false
        }
      }
      if (selectedRoleCode) {
        const roleObj = data.roles.find((r) => r.codigo === selectedRoleCode)
        if (roleObj && !roleObj.permisos.includes(perm.codigo)) {
          return false
        }
      }
      return true
    })
  }, [data, selectedModule, searchPerm, selectedRoleCode])

  const filteredPlans = useMemo(() => {
    if (!data) return []
    return data.planes_saas.filter((plan) => {
      if (selectedSegment === "ALL") return true
      return plan.segmento === selectedSegment
    })
  }, [data, selectedSegment])

  if (isLoading) {
    return (
      <div className="p-8 text-sm font-mono text-on-surface-variant">
        Cargando estructura de roles, autorizaciones y planes de servicio...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-sm text-error">
        No fue posible cargar la información: {error instanceof Error ? error.message : "Error"}
      </div>
    )
  }

  const totalUsersAssigned = data.roles.reduce((acc, r) => acc + (r.usuarios_count || 0), 0)
  const modulesList = ["ALL", ...Array.from(new Set(data.permisos.map((p) => p.modulo)))]

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      {activeSection === "roles" ? (
        <>
          {/* Header limpio sin badges decorativos */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Roles y Matriz de Autorizaciones
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Perfiles institucionales del sistema y desglose de las {data.permisos.length} autorizaciones operativas verificadas en cada acción.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant/35 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-on-surface-variant">Perfiles activos:</span>
                <span className="font-mono font-bold text-on-surface">{data.roles.length}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant/35 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-on-surface-variant">Usuarios asignados:</span>
                <span className="font-mono font-bold text-on-surface">{totalUsersAssigned}</span>
              </div>
            </div>
          </div>

          {/* Tarjetas Interactivas de Roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.roles.map((role) => {
              const isSelected = selectedRoleCode === role.codigo
              const coveragePct = Math.round(
                (role.permisos.length / Math.max(1, data.permisos.length)) * 100,
              )
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() =>
                    setSelectedRoleCode(isSelected ? null : role.codigo)
                  }
                  className={`text-left rounded-2xl border p-5 transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "bg-primary/8 border-primary shadow-md"
                      : "bg-surface border-outline-variant/35 hover:border-primary/50 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-on-surface-variant">
                        {role.usuarios_count} {role.usuarios_count === 1 ? "usuario" : "usuarios"}
                      </span>
                    </div>

                    <h2 className="font-display text-sm font-bold text-on-surface leading-snug">
                      {role.nombre}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                      {role.descripcion}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-outline-variant/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Alcance de permisos</span>
                      <span className="font-mono font-bold text-primary">
                        {role.permisos.length} / {data.permisos.length} ({coveragePct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${coveragePct}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Barra de Filtros de la Matriz */}
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {modulesList.map((mod) => {
                const active = selectedModule === mod
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModule(mod)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {MODULE_LABELS[mod] || mod}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2.5">
              {selectedRoleCode && (
                <button
                  type="button"
                  onClick={() => setSelectedRoleCode(null)}
                  className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 cursor-pointer"
                >
                  Mostrando solo rol seleccionado ×
                </button>
              )}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchPerm}
                  onChange={(e) => setSearchPerm(e.target.value)}
                  placeholder="Filtrar autorización o descripción..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Matriz de Autorizaciones */}
          <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="font-display text-sm font-bold text-on-surface">
                  Matriz Comparativa de Autorizaciones ({filteredPermissions.length} de {data.permisos.length})
                </h2>
              </div>
              <span className="text-[11px] text-on-surface-variant hidden sm:inline">
                Haz clic en una tarjeta de rol superior para filtrar sus permisos exclusivos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant uppercase font-mono text-[11px]">
                    <th className="py-3.5 px-4">Autorización</th>
                    <th className="py-3.5 px-4">Módulo</th>
                    <th className="py-3.5 px-4">Plan Mínimo</th>
                    {data.roles.map((r) => (
                      <th
                        key={r.id}
                        className={`py-3.5 px-4 text-center ${
                          selectedRoleCode === r.codigo ? "text-primary font-bold" : ""
                        }`}
                      >
                        {r.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {filteredPermissions.map((perm) => (
                    <tr
                      key={perm.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-on-surface">
                          {formatPermissionLabel(perm.codigo)}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {perm.descripcion}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-surface-container text-[11px] font-semibold text-on-surface">
                          {MODULE_LABELS[perm.modulo] || perm.modulo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-primary text-[11px]">
                        {formatPlanLabel(perm.plan_minimo)}
                      </td>
                      {data.roles.map((r) => {
                        const hasPerm = r.permisos.includes(perm.codigo)
                        return (
                          <td key={r.id} className="py-3 px-4 text-center">
                            {hasPerm ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 text-outline/35">
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
        </>
      ) : (
        <>
          {/* SECCIÓN 2: CATÁLOGO DE PLANES DE SERVICIO */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Planes de Suscripción Institucional y Empresarial
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Niveles de servicio y capacidades habilitadas para entidades públicas (B2G), empresas proveedoras del Estado (B2B) y administración general.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-surface border border-outline-variant/35 rounded-xl p-1">
              {[
                { id: "ALL" as const, label: "Todos" },
                { id: "B2G" as const, label: "Sector Público (B2G)" },
                { id: "B2B" as const, label: "Proveedores (B2B)" },
                { id: "PLATFORM" as const, label: "Plataforma" },
              ].map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setSelectedSegment(seg.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSegment === seg.id
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlans.map((tier) => {
              const meta = PLAN_PRICING_META[tier.codigo] || {
                price: "Personalizado",
                period: "Suscripción",
                badge: tier.segmento,
              }
              const unlockedPermsCount = data.permisos.filter(
                (p) => p.plan_minimo === "ALL" || p.plan_minimo === tier.codigo,
              ).length

              return (
                <div
                  key={tier.codigo}
                  className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                    meta.highlight
                      ? "bg-surface border-primary/60 shadow-md"
                      : "bg-surface border-outline-variant/35 shadow-sm"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        <span>{meta.badge}</span>
                      </span>
                      {meta.highlight && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                          <Sparkles className="w-3 h-3" />
                          <span>Recomendado</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="font-display text-lg font-bold text-on-surface">
                        {formatPlanLabel(tier.codigo)}
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-1">{tier.alcance}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/25">
                      <p className="font-mono text-base font-bold text-on-surface">{meta.price}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{meta.period}</p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Capacidades incluidas
                      </p>
                      <ul className="space-y-2">
                        {tier.capacidades.map((fn) => (
                          <li
                            key={fn}
                            className="text-xs text-on-surface flex items-start gap-2 leading-relaxed"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{fn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Nivel de cobertura</span>
                    <span className="font-mono font-bold text-primary">
                      {unlockedPermsCount}+ módulos habilitados
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
