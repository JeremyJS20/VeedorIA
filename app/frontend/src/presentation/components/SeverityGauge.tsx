import { useTranslation } from "react-i18next"

interface SeverityGaugeProps {
  value: number
  confidence?: number
  signalsCount?: number
  className?: string
}

export default function SeverityGauge({ value, confidence, signalsCount, className = "" }: SeverityGaugeProps) {
  const { t } = useTranslation("dashboard")
  const normalized = Math.min(Math.max(value, 0), 100)
  const dashOffset = 100 - normalized
  const isCritical = normalized >= 70
  const isHigh = normalized >= 50
  const strokeColor = isCritical ? "#dc2626" : isHigh ? "#e67e22" : "#166534"

  const riskLabel =
    normalized >= 70 ? "drawer.risk_critical" : normalized >= 50 ? "drawer.risk_high" : normalized >= 30 ? "drawer.risk_medium" : "drawer.risk_low"

  const factors = signalsCount && signalsCount > 0 ? signalsCount : Math.max(1, Math.floor(normalized / 25))
  const conf = confidence ?? 94

  return (
    <div className={`bg-background rounded-2xl p-6 flex items-center gap-8 border border-outline-variant/20 ${className}`}>
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" fill="none" r="16" strokeWidth="3" className="stroke-outline-variant/30" />
          <circle
            cx="18"
            cy="18"
            fill="none"
            r="16"
            strokeWidth="3"
            stroke={strokeColor}
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-data text-2xl font-bold" style={{ color: strokeColor }}>
            {normalized}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <span className="font-bold text-sm" style={{ color: strokeColor }}>
          {t(riskLabel)}
        </span>
        <p className="text-xs text-outline leading-relaxed">
          {t("drawer.confidence_text", { confidence: conf, factors })}
        </p>
      </div>
    </div>
  )
}
