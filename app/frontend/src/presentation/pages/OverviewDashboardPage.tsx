import { Link } from "react-router-dom"
import {
  Lock,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react"
import { useDashboardOverview } from "../hooks/useAuthManagement"

function formatCurrencyDop(val: number): string {
  if (!val || val <= 0) return "—"
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(val)
}

export default function OverviewDashboardPage() {
  const { data: overview, isLoading } = useDashboardOverview()

  const variant = overview?.variant || "B2G"

  const variantMeta = {
    B2G: {
      title: "Panorama Ejecutivo de Auditoría",
      subtitle: "Resumen preventivo de expedientes, alertas e indicadores de integridad contractual.",
      ctaLabel: "Ir a Bandeja de Anomalías",
      ctaLink: "/app/bandeja",
    },
    B2B: {
      title: "Panorama Competitivo y Oportunidades",
      subtitle: "Seguimiento de adjudicaciones, participación en el sector y actividad en sus rubros.",
      ctaLabel: "Abrir Inteligencia de Mercado",
      ctaLink: "/app/mercado",
    },
    ADMIN: {
      title: "Panorama Operativo de la Plataforma",
      subtitle: "Estado general de sincronizaciones de datos, cobertura institucional y cuentas activas.",
      ctaLabel: "Gestionar Organizaciones y Usuarios",
      ctaLink: "/app/usuarios",
    },
  }[variant]

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      {/* Clean Unboxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            {variantMeta.title}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            {variantMeta.subtitle}
          </p>
        </div>

        <Link
          to={variantMeta.ctaLink}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs shrink-0"
        >
          <span>{variantMeta.ctaLabel}</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4 KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-32 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(overview?.kpis || []).map((kpi) => {
            const borderAccent = {
              primary: "border-l-4 border-l-primary",
              warning: "border-l-4 border-l-amber-500",
              danger: "border-l-4 border-l-red-600",
              neutral: "border-l-4 border-l-outline-variant",
            }[kpi.tone]

            return (
              <div
                key={kpi.id}
                className={`bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 ${borderAccent} rounded-2xl p-5 flex flex-col justify-between shadow-xs`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {kpi.label}
                </span>

                {kpi.locked ? (
                  <div className="mt-3 pt-2 border-t border-outline-variant/25 space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Indicador restringido por plan</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-snug">
                      Disponible en{" "}
                      <span className="font-semibold text-on-surface">
                        {kpi.required_plan_label || "Plan Superior"}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-2.5 space-y-1">
                    <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
                      {kpi.value}
                    </p>
                    <p className="text-xs text-on-surface-variant">{kpi.sublabel}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Central Table Section */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-on-surface">
              {overview?.table_title || "Registros Recientes"}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {overview?.table_subtitle}
            </p>
          </div>
          <Link
            to={variantMeta.ctaLink}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Ver listado completo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-5">Referencia</th>
                <th className="py-3 px-5">Descripción</th>
                <th className="py-3 px-5">Entidad / Origen</th>
                <th className="py-3 px-5">Detalle</th>
                {variant !== "ADMIN" && (
                  <th className="py-3 px-5 text-right">Monto Adjudicado</th>
                )}
                <th className="py-3 px-5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {(overview?.rows || []).map((row) => {
                const badgeStyle = {
                  critical:
                    "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/25",
                  warning:
                    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25",
                  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25",
                }[row.status_tone]

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-semibold text-primary whitespace-nowrap">
                      {row.process_code}
                      <div className="text-[11px] font-normal text-on-surface-variant">
                        {row.date_label}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-on-surface max-w-[360px]">
                      <p className="line-clamp-2">{row.title}</p>
                    </td>
                    <td className="py-3.5 px-5 text-on-surface-variant max-w-[240px] truncate">
                      {row.secondary_label}
                    </td>
                    <td className="py-3.5 px-5">
                      {row.locked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                          <Lock className="w-3 h-3" />
                          <span>{row.required_plan_label || "Plan Avanzado"}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-on-surface-variant">
                          {row.detail_badge}
                        </span>
                      )}
                    </td>
                    {variant !== "ADMIN" && (
                      <td className="py-3.5 px-5 text-right font-mono font-semibold text-on-surface whitespace-nowrap">
                        {row.locked ? "Restringido" : formatCurrencyDop(row.amount_dop)}
                      </td>
                    )}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeStyle}`}
                      >
                        {row.status_tone === "low" && <CheckCircle2 className="w-3 h-3" />}
                        <span>{row.status_badge}</span>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}