import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"

interface AnomalyFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  anomalyType: string
  onTypeChange: (v: string) => void
  severity: string
  onSeverityChange: (v: string) => void
  className?: string
}

export default function AnomalyFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  anomalyType,
  onTypeChange,
  severity,
  onSeverityChange,
  className = "",
}: AnomalyFiltersProps) {
  const { t } = useTranslation("dashboard")

  return (
    <div className={`flex flex-col lg:flex-row items-stretch lg:items-center gap-3 ${className}`}>
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("header.search_placeholder")}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary transition-all"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filtrar por estado"
          className="h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="">{t("anomalies.filter_status")}: Todos</option>
          <option value="PENDING">{t("anomalies.status_pending")}</option>
          <option value="CONFIRMED">{t("anomalies.status_confirmed")}</option>
          <option value="DISMISSED">{t("anomalies.status_dismissed")}</option>
        </select>
        <select
          value={anomalyType}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Filtrar por tipo de anomalía"
          className="h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="">{t("anomalies.filter_type")}: {t("anomalies.type_all")}</option>
          <option value="PRICE_ANOMALY">{t("anomalies.type_price")}</option>
          <option value="FRAGMENTATION">{t("anomalies.type_fragmentation")}</option>
          <option value="COLLUSION">{t("anomalies.type_collusion")}</option>
        </select>
        <select
          value={severity}
          onChange={(e) => onSeverityChange(e.target.value)}
          aria-label="Filtrar por severidad"
          className="h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="">{t("anomalies.filter_severity")}: {t("anomalies.severity_all")}</option>
          <option value="0.7">{t("anomalies.severity_critical")}</option>
          <option value="0.4">{t("anomalies.severity_medium")}</option>
          <option value="0.1">{t("anomalies.severity_low")}</option>
        </select>
      </div>
    </div>
  )
}
