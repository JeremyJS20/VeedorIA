import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface KpiCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: LucideIcon
  /** Franja lateral: `primary` para métricas clave, `neutral` para contextuales. */
  accent?: "primary" | "neutral" | "warning" | "danger" | "success"
  /** Clases extra para el valor (p. ej. `text-primary`). */
  valueClassName?: string
  /** Contenido alineado a la derecha del valor (p. ej. el porcentaje de uso). */
  trailing?: ReactNode
  /** Contenido extra bajo el hint (p. ej. una barra de progreso). */
  children?: ReactNode
  className?: string
}

const ACCENT_STYLES = {
  primary: "border-l-primary",
  neutral: "border-l-outline-variant",
  warning: "border-l-amber-500",
  danger: "border-l-red-600",
  success: "border-l-emerald-500",
} as const

export default function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "primary",
  valueClassName = "",
  trailing,
  children,
  className = "",
}: KpiCardProps) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/35 border-l-4 ${ACCENT_STYLES[accent]} bg-surface-container-lowest dark:bg-surface-container p-5 space-y-2 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-outline shrink-0" />}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`font-mono text-xl font-bold text-on-surface truncate ${valueClassName}`}>
          {value}
        </p>
        {trailing}
      </div>
      {hint && <p className="text-[11px] text-on-surface-variant">{hint}</p>}
      {children}
    </div>
  )
}
