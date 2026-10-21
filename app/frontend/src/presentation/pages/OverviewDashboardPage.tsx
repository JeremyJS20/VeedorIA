import { Link } from "react-router-dom"
import {
  Lock,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react"
import { useDashboardOverview } from "../hooks/useAuthManagement"
import DataTable from "../components/ui/DataTable"
import StatusChip from "../components/ui/StatusChip"
import KpiCard from "../components/ui/KpiCard"

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
          {(overview?.kpis || []).map((kpi) => (
            <KpiCard
              key={kpi.id}
              label={kpi.label}
              accent={kpi.tone}
              value={
                kpi.locked ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Indicador restringido por plan</span>
                  </span>
                ) : (
                  kpi.value
                )
              }
              hint={
                kpi.locked
                  ? `Disponible en ${kpi.required_plan_label || "Plan Superior"}`
                  : kpi.sublabel
              }
            />
          ))}
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

        <DataTable
          rows={overview?.rows ?? []}
          rowKey={(row) => row.id}
          emptyMessage="Todavía no hay expedientes para mostrar en este panorama."
          columns={[
            {
              key: "referencia",
              header: "Referencia",
              cellClassName: "font-mono font-semibold text-primary whitespace-nowrap",
              cell: (row) => (
                <>
                  {row.process_code}
                  <div className="text-[11px] font-normal text-on-surface-variant">{row.date_label}</div>
                </>
              ),
            },
            {
              key: "descripcion",
              header: "Descripción",
              cellClassName: "font-medium text-on-surface max-w-[360px]",
              cell: (row) => <p className="line-clamp-2">{row.title}</p>,
            },
            {
              key: "entidad",
              header: "Entidad / Origen",
              cellClassName: "text-on-surface-variant max-w-[240px] truncate",
              cell: (row) => row.secondary_label,
            },
            {
              key: "detalle",
              header: "Detalle",
              cell: (row) =>
                row.locked ? (
                  <StatusChip
                    tone="warning"
                    label={row.required_plan_label || "Plan Avanzado"}
                    icon={Lock}
                    iconClassName="w-3 h-3"
                  />
                ) : (
                  <span className="text-xs font-medium text-on-surface-variant">{row.detail_badge}</span>
                ),
            },
            ...(variant !== "ADMIN"
              ? [
                  {
                    key: "monto",
                    header: "Monto Adjudicado",
                    align: "right" as const,
                    cellClassName: "font-mono font-semibold text-on-surface whitespace-nowrap",
                    cell: (row: NonNullable<typeof overview>["rows"][number]) =>
                      row.locked ? "Restringido" : formatCurrencyDop(row.amount_dop),
                  },
                ]
              : []),
            {
              key: "estado",
              header: "Estado",
              align: "right",
              cell: (row) => (
                <StatusChip
                  tone={row.status_tone === "critical" ? "danger" : row.status_tone === "warning" ? "warning" : "success"}
                  label={row.status_badge}
                  icon={row.status_tone === "low" ? CheckCircle2 : undefined}
                  iconClassName="w-3 h-3"
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}