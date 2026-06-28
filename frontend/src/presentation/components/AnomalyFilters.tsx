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
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="relative w-full max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("header.search_placeholder")}
          className="w-full h-[40px] pl-10 pr-4 rounded-xl border border-outline-variant/30 bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-outline" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-surface border border-outline-variant/20 rounded-lg px-4 py-2 text-xs font-semibold text-on-surface outline-none cursor-pointer"
        >
          <option value="">{t("anomalies.filter_status")}: {t("anomalies.status_pending")}</option>
          <option value="PENDING">{t("anomalies.status_pending")}</option>
          <option value="CONFIRMED">{t("anomalies.status_confirmed")}</option>
          <option value="DISMISSED">{t("anomalies.status_dismissed")}</option>
        </select>
        <select
          value={anomalyType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-surface border border-outline-variant/20 rounded-lg px-4 py-2 text-xs font-semibold text-on-surface outline-none cursor-pointer"
        >
          <option value="">{t("anomalies.filter_type")}: {t("anomalies.type_all")}</option>
          <option value="PRICE_ANOMALY">{t("anomalies.type_price")}</option>
          <option value="FRAGMENTATION">{t("anomalies.type_fragmentation")}</option>
          <option value="COLLUSION">{t("anomalies.type_collusion")}</option>
        </select>
        <select
          value={severity}
          onChange={(e) => onSeverityChange(e.target.value)}
          className="bg-surface border border-outline-variant/20 rounded-lg px-4 py-2 text-xs font-semibold text-on-surface outline-none cursor-pointer"
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
