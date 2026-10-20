import { useTranslation } from "react-i18next"
import { ArrowUpRight, CheckCircle2, XCircle, Clock } from "lucide-react"
import type { Anomaly } from "../../domain/anomaly"

interface AnomalyCardProps {
  anomaly: Anomaly
  isSelected: boolean
  onClick: () => void
  className?: string
}

const typeConfig = {
  PRICE_ANOMALY: {
    label: "anomalies.type_price",
    badgeClass: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25",
  },
  FRAGMENTATION: {
    label: "anomalies.type_fragmentation",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  COLLUSION: {
    label: "anomalies.type_collusion",
    badgeClass: "bg-primary/10 text-primary border-primary/25",
  },
}

const severityBorder = {
  critical: "border-l-red-600",
  high: "border-l-amber-500",
  medium: "border-l-primary",
  low: "border-l-emerald-500",
}

function getSeverityClass(severity: number) {
  if (severity >= 0.7) return "critical"
  if (severity >= 0.4) return "high"
  if (severity >= 0.2) return "medium"
  return "low"
}

function formatAmount(amount: number | null) {
  if (amount == null) return "RD$ —"
  return `RD$ ${amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function AnomalyCard({
  anomaly,
  isSelected,
  onClick,
  className = "",
}: AnomalyCardProps) {
  const { t } = useTranslation("dashboard")
  const type = typeConfig[anomaly.anomaly_type]
  const sevClass = getSeverityClass(anomaly.severity)
  const severityPct = Math.round((anomaly.severity || 0) * 100)

  const statusBadge =
    anomaly.status === "CONFIRMED" ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/25">
        <CheckCircle2 className="w-3 h-3" />
        Confirmada
      </span>
    ) : anomaly.status === "DISMISSED" ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
        <XCircle className="w-3 h-3" />
        Desestimada
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
        <Clock className="w-3 h-3" />
        Pendiente
      </span>
    )

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-outline-variant/30 border-l-4 ${severityBorder[sevClass]} p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all cursor-pointer ${
        isSelected
          ? "bg-primary/5 ring-2 ring-primary/30"
          : "bg-surface-container-low/50 hover:bg-surface-container-low"
      } ${className}`}
    >
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider border ${type.badgeClass}`}
          >
            {t(type.label)}
          </span>
          {statusBadge}
          <span className="font-mono text-xs font-bold text-primary">
            {anomaly.process_code ||
              anomaly.contract_id?.toString().slice(0, 8).toUpperCase() ||
              anomaly.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="font-mono text-[11px] font-bold text-on-surface-variant">
            · Severidad {severityPct}%
          </span>
          {anomaly.anomaly_type === "COLLUSION" && anomaly.signals_count != null && (
            <span className="text-[11px] text-on-surface-variant font-mono">
              · {anomaly.signals_count} señal(es)
            </span>
          )}
        </div>

        <h3 className="font-display font-bold text-on-surface text-sm leading-snug line-clamp-2">
          {anomaly.description || t("anomalies.no_description")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
              {t("anomalies.amount")}
            </span>
            <p className="font-mono font-bold text-on-surface mt-0.5">
              {formatAmount(anomaly.amount)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
              {t("anomalies.supplier")}
            </span>
            <p className="font-semibold text-on-surface truncate mt-0.5">
              {anomaly.supplier_name || "—"}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
              Entidad / {t("anomalies.date")}
            </span>
            <p className="text-on-surface-variant truncate mt-0.5">
              {anomaly.institution_name ? `${anomaly.institution_name} · ` : ""}
              <span className="font-mono">{anomaly.created_at?.slice(0, 10) || "—"}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end shrink-0">
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-primary/10 text-primary border border-outline-variant/35 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>{t("anomalies.investigate")}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
