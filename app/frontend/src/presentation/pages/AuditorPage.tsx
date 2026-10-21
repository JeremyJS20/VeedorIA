import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Play, RotateCcw } from "lucide-react"
import { useAnomalies, useAnomalyStats, useRunDetection } from "../hooks/useAnomalyQueries"
import AnomalyCard from "../components/AnomalyCard"
import AnomalyFilters from "../components/AnomalyFilters"
import AnomalyDrawer from "../components/AnomalyDrawer"
import KpiCard from "../components/ui/KpiCard"
import type { Anomaly } from "../../domain/anomaly"

export default function AuditorPage() {
  const { t } = useTranslation("dashboard")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("")
  const [anomalyType, setAnomalyType] = useState("")
  const [severity, setSeverity] = useState("")
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const minSeverity = severity ? parseFloat(severity) : undefined

  const { data: stats, isLoading: statsLoading } = useAnomalyStats()
  const { data: anomaliesData, isLoading: anomaliesLoading } = useAnomalies({
    anomaly_type: anomalyType || undefined,
    status: status || undefined,
    min_severity: minSeverity,
    search: debouncedSearch || undefined,
    limit: 50,
  })
  const detectMutation = useRunDetection()

  const isLoading = anomaliesLoading || statsLoading
  const items = anomaliesData?.items || []

  const handleResetFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setStatus("")
    setAnomalyType("")
    setSeverity("")
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
          {/* Header matching OverviewDashboardPage & InstitutionalProcessesPage */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Bandeja de Anomalías y Alertas Preventivas
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Priorización de expedientes con señales de sobreprecio, fraccionamiento contractual o concurrencia atípica para dictamen técnico.
              </p>
            </div>

            <button
              type="button"
              disabled={detectMutation.isPending}
              onClick={() => detectMutation.mutate()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>
                {detectMutation.isPending ? t("anomalies.detect_running") : t("anomalies.detect_title")}
              </span>
            </button>
          </div>

          {/* 4 KPI Cards compartidas (ui/KpiCard) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label={t("anomalies.total")}
              value={statsLoading ? "..." : (stats?.total ?? 0).toLocaleString("es-DO")}
              hint="Hallazgos detectados en el alcance"
            />
            <KpiCard
              label={t("anomalies.critical")}
              value={
                statsLoading ? "..." : (stats?.total_by_status?.PENDING ?? 0).toLocaleString("es-DO")
              }
              hint="Pendientes de revisión técnica"
              accent="warning"
              valueClassName="text-amber-600 dark:text-amber-400"
            />
            <KpiCard
              label={t("anomalies.investigating")}
              value={
                statsLoading ? "..." : (stats?.total_by_status?.CONFIRMED ?? 0).toLocaleString("es-DO")
              }
              hint="Irregularidades ratificadas"
              accent="danger"
              valueClassName="text-red-600 dark:text-red-400"
            />
            <KpiCard
              label={t("anomalies.resolved")}
              value={
                statsLoading ? "..." : (stats?.total_by_status?.DISMISSED ?? 0).toLocaleString("es-DO")
              }
              hint="Alertas desestimadas con sustento"
              accent="neutral"
            />
          </div>

          {/* Elevated Filter Bar */}
          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <AnomalyFilters
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
              anomalyType={anomalyType}
              onTypeChange={setAnomalyType}
              severity={severity}
              onSeverityChange={setSeverity}
              className="flex-1"
            />
            {(search || status || anomalyType || severity) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-medium text-on-surface-variant hover:text-on-surface inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                title="Restablecer filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* List Container matching new pages */}
          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Cola Priorizada de Hallazgos para Revisión
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Seleccione cualquier caso para abrir el expediente forense y emitir dictamen de confirmación o descarte
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                {items.length} alertas en vista
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {isLoading ? (
                <div className="text-center py-12 font-mono text-xs text-on-surface-variant">
                  {t("anomalies.loading")}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-xs text-on-surface-variant">
                  {t("anomalies.no_anomalies")}
                </div>
              ) : (
                items.map((a) => (
                  <AnomalyCard
                    key={a.id}
                    anomaly={a}
                    isSelected={selectedAnomaly?.id === a.id}
                    onClick={() => setSelectedAnomaly(a)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedAnomaly && (
        <AnomalyDrawer anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} />
      )}
    </div>
  )
}
