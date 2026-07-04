import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import type { Anomaly } from "../../domain/anomaly"
import InsetPanel from "./ui/InsetPanel"
import Button from "./ui/Button"

interface AnomalyCardProps {
  anomaly: Anomaly
  isSelected: boolean
  onClick: () => void
  className?: string
}

const typeConfig = {
  PRICE_ANOMALY: { label: "anomalies.type_price", color: "error", bg: "bg-error/10", text: "text-error" },
  FRAGMENTATION: { label: "anomalies.type_fragmentation", color: "warning", bg: "bg-warning/10", text: "text-warning" },
  COLLUSION: { label: "anomalies.type_collusion", color: "primary", bg: "bg-primary/10", text: "text-primary" },
}

const confidenceConfig: Record<string, { bg: string; text: string; label: string }> = {
  ALTA: { bg: "bg-[#10B981]/15", text: "text-[#10B981]", label: "ALTA" },
  MEDIA: { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", label: "MEDIA" },
  BAJA: { bg: "bg-[#94A3B8]/15", text: "text-[#94A3B8]", label: "BAJA" },
}

const severityBorder = {
  critical: "border-l-error",
  high: "border-l-warning",
  medium: "border-l-primary",
  low: "border-l-success",
}

function getSeverityClass(severity: number) {
  if (severity >= 0.7) return "critical"
  if (severity >= 0.4) return "high"
  if (severity >= 0.2) return "medium"
  return "low"
}

function formatAmount(amount: number | null) {
  if (amount == null) return "RD$ --"
  return `RD$ ${amount.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AnomalyCard({ anomaly, isSelected, onClick, className = "" }: AnomalyCardProps) {
  const { t } = useTranslation("dashboard")
  const type = typeConfig[anomaly.anomaly_type]
  const sevClass = getSeverityClass(anomaly.severity)

  return (
    <InsetPanel
      hoverable
      className={`h-[130px] border-l-4 ${severityBorder[sevClass]} p-4 flex items-center justify-between group cursor-pointer ${className} ${
        isSelected ? "ring-2 ring-primary/20" : ""
      }`}
    >
      <div onClick={onClick} className="flex flex-col justify-between h-full flex-1">
        <div className="flex items-center gap-3">
          <span className={`${type.bg} ${type.text} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>
            {t(type.label)}
          </span>
          {anomaly.anomaly_type === "COLLUSION" && anomaly.confidence && (
            <>
              <span className={`${confidenceConfig[anomaly.confidence].bg} ${confidenceConfig[anomaly.confidence].text} text-[10px] font-bold px-2 py-0.5 rounded-[8px] uppercase`}>
                {confidenceConfig[anomaly.confidence].label}
              </span>
              {anomaly.signals_count != null && (
                <span className="text-[10px] text-outline font-ui">
                  {anomaly.signals_count} señal(es)
                </span>
              )}
            </>
          )}
          <span className="font-data text-xs text-outline">{anomaly.process_code || anomaly.contract_id?.toString().slice(0, 8).toUpperCase() || anomaly.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <h3 className="font-display font-bold text-primary line-clamp-2 text-sm">
          {anomaly.description || t("anomalies.no_description")}
        </h3>
        <div className="flex items-center gap-6 text-[11px]">
          <div>
            <span className="text-outline font-medium uppercase tracking-tighter">{t("anomalies.amount")}</span>
            <p className="font-data font-bold text-on-surface">{formatAmount(anomaly.amount)}</p>
          </div>
          <div>
            <span className="text-outline font-medium uppercase tracking-tighter">{t("anomalies.supplier")}</span>
            <p className="font-ui font-semibold text-on-surface truncate max-w-[160px]">
              {anomaly.supplier_name || "--"}
            </p>
          </div>
          <div>
            <span className="text-outline font-medium uppercase tracking-tighter">{t("anomalies.date")}</span>
            <p className="font-ui font-semibold text-on-surface">
              {anomaly.created_at?.slice(0, 10) || "--"}
            </p>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onClick} className="flex items-center gap-1">
        {t("anomalies.investigate")}
        <ChevronRight className="w-[18px] h-[18px]" />
      </Button>
    </InsetPanel>
  )
}
