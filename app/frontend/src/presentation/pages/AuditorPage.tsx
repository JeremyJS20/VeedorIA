import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Play } from "lucide-react"
import { useAnomalies, useAnomalyStats, useRunDetection } from "../hooks/useAnomalyQueries"
import Button from "../components/ui/Button"
import InsetPanel from "../components/ui/InsetPanel"
import AnomalyCard from "../components/AnomalyCard"
import AnomalyFilters from "../components/AnomalyFilters"
import AnomalyDrawer from "../components/AnomalyDrawer"
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

  return (
    <div className="flex h-full">
      <div className={`flex-1 overflow-y-auto p-8 space-y-8 ${selectedAnomaly ? "" : ""}`}>
        <div className="grid grid-cols-4 gap-6">
          <InsetPanel className="!p-6">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
              {t("anomalies.total")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold">
                {statsLoading ? "..." : stats?.total ?? 0}
              </span>
            </div>
          </InsetPanel>
          <InsetPanel className="!p-6 !border-l-4 !border-l-error">
            <p className="text-[10px] font-bold text-error uppercase tracking-widest mb-1">
              {t("anomalies.critical")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-error">
                {statsLoading ? "..." : (stats?.total_by_status?.PENDING ?? 0)}
              </span>
            </div>
          </InsetPanel>
          <InsetPanel className="!p-6 !border-l-4 !border-l-warning">
            <p className="text-[10px] font-bold text-warning uppercase tracking-widest mb-1">
              {t("anomalies.investigating")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-warning">
                {statsLoading ? "..." : (stats?.total_by_status?.CONFIRMED ?? 0)}
              </span>
            </div>
          </InsetPanel>
          <InsetPanel className="!p-6 !border-l-4 !border-l-success">
            <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-1">
              {t("anomalies.resolved")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-success">
                {statsLoading ? "..." : (stats?.total_by_status?.DISMISSED ?? 0)}
              </span>
            </div>
          </InsetPanel>
        </div>

        <div className="flex items-center justify-between">
          <AnomalyFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            anomalyType={anomalyType}
            onTypeChange={setAnomalyType}
            severity={severity}
            onSeverityChange={setSeverity}
          />
          <Button variant="primary" size="md" onClick={() => detectMutation.mutate()} isDisabled={detectMutation.isPending}>
            <Play className="w-4 h-4" />
            {detectMutation.isPending ? t("anomalies.detect_running") : t("anomalies.detect_title")}
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-outline">{t("anomalies.loading")}</div>
          ) : !anomaliesData?.items?.length ? (
            <div className="text-center py-12 text-outline">{t("anomalies.no_anomalies")}</div>
          ) : (
            anomaliesData.items.map((a) => (
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

      {selectedAnomaly && (
        <AnomalyDrawer anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} />
      )}
    </div>
  )
}
